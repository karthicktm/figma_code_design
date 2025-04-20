import { FigmaClient } from '@/lib/figma-api';
import { IAgent, AssetManagerResult, AssetManagerConfig, DesignInputResult } from '@/types/agent-interfaces';
import axios from 'axios';

// In browser environment, we can't use Node's fs module
// Instead, we'll use browser APIs and simulate a file system
interface VirtualFile {
  name: string;
  path: string;
  content: ArrayBuffer | string;
  url: string; // URL.createObjectURL result
}

export class AssetManagerAgent implements IAgent {
  private apiKey: string;
  private fileId: string;
  private virtualFileSystem: VirtualFile[] = [];
  private onProgress?: (progress: number) => void;
  
  constructor(
    config: { apiKey: string; fileId: string },
    onProgress?: (progress: number) => void
  ) {
    this.apiKey = config.apiKey;
    this.fileId = config.fileId;
    this.onProgress = onProgress;
  }
  
  async execute(inputs: any[]): Promise<AssetManagerResult> {
    try {
      this.updateProgress(5);
      
      if (!inputs[0]) {
        throw new Error('No design input provided');
      }
      
      const designInput = inputs[0] as DesignInputResult;
      
      // Initialize Figma client
      const figmaClient = new FigmaClient(this.apiKey);
      
      // Process and download images
      this.updateProgress(10);
      const downloadedImages = await this.processImages(designInput, figmaClient);
      this.updateProgress(40);
      
      // Process and download icons
      const downloadedIcons = await this.processIcons(designInput, figmaClient);
      this.updateProgress(70);
      
      // Process fonts
      const processedFonts = this.processFonts(designInput.assets.fonts);
      this.updateProgress(100);
      
      return {
        downloadedAssets: {
          images: downloadedImages.successful,
          icons: downloadedIcons.successful,
          fonts: processedFonts.downloadedFonts,
        },
        missingAssets: {
          images: downloadedImages.failed,
          icons: downloadedIcons.failed,
          fonts: processedFonts.missingFonts,
        }
      };
    } catch (error) {
      console.error('Asset Manager Agent error:', error);
      throw new Error(`Failed to manage assets: ${error.message}`);
    }
  }
  
  private updateProgress(progress: number) {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }
  
  private async processImages(
    designInput: DesignInputResult,
    figmaClient: FigmaClient
  ): Promise<{ 
    successful: Array<{ id: string; url: string; localPath: string }>;
    failed: string[];
  }> {
    const successful: Array<{ id: string; url: string; localPath: string }> = [];
    const failed: string[] = [];
    
    if (!designInput.assets.images || designInput.assets.images.length === 0) {
      return { successful, failed };
    }
    
    // Get image URLs from Figma
    const imageNodeIds = designInput.assets.images.map(img => img.nodeId);
    const imageResponses = await figmaClient.getImageFills(this.fileId, imageNodeIds);
    
    // Download images
    for (let i = 0; i < designInput.assets.images.length; i++) {
      const image = designInput.assets.images[i];
      const imageUrl = imageResponses.images[image.nodeId];
      
      if (!imageUrl) {
        failed.push(`Image ${image.nodeId}`);
        continue;
      }
      
      try {
        // Download image
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = response.data;
        
        // Create filename
        const fileName = `image_${image.nodeId.replace(':', '_')}.png`;
        const filePath = `assets/images/${fileName}`;
        
        // Store in virtual file system
        const objectUrl = URL.createObjectURL(
          new Blob([imageBuffer], { type: 'image/png' })
        );
        
        this.virtualFileSystem.push({
          name: fileName,
          path: filePath,
          content: imageBuffer,
          url: objectUrl
        });
        
        successful.push({
          id: image.nodeId,
          url: objectUrl,
          localPath: filePath
        });
      } catch (error) {
        console.error(`Failed to download image ${image.nodeId}:`, error);
        failed.push(`Image ${image.nodeId}`);
      }
    }
    
    return { successful, failed };
  }
  
  private async processIcons(
    designInput: DesignInputResult,
    figmaClient: FigmaClient
  ): Promise<{ 
    successful: Array<{ id: string; url: string; localPath: string; svg?: string }>;
    failed: string[];
  }> {
    // For now, let's use a simple heuristic to identify icons
    // In a real implementation, this would be more sophisticated
    
    // Look for small frames/components that might be icons
    const icons = designInput.components.filter(component => 
      (component.width <= 64 && component.height <= 64) || 
      component.name.toLowerCase().includes('icon')
    );
    
    const successful: Array<{ id: string; url: string; localPath: string; svg?: string }> = [];
    const failed: string[] = [];
    
    if (icons.length === 0) {
      return { successful, failed };
    }
    
    // Get SVG exports
    const iconNodeIds = icons.map(icon => icon.id);
    
    try {
      // Try to get SVGs when possible
      const svgResponses = await figmaClient.getImageFills(this.fileId, iconNodeIds, 'svg');
      
      // Download icons
      for (let i = 0; i < icons.length; i++) {
        const icon = icons[i];
        const svgUrl = svgResponses.images[icon.id];
        
        if (!svgUrl) {
          failed.push(`Icon ${icon.id}`);
          continue;
        }
        
        try {
          // Download SVG
          const response = await axios.get(svgUrl);
          const svgContent = response.data;
          
          // Create filename
          const fileName = `icon_${icon.name.replace(/\s+/g, '_').toLowerCase()}_${icon.id.replace(':', '_')}.svg`;
          const filePath = `assets/icons/${fileName}`;
          
          // Store in virtual file system
          const objectUrl = URL.createObjectURL(
            new Blob([svgContent], { type: 'image/svg+xml' })
          );
          
          this.virtualFileSystem.push({
            name: fileName,
            path: filePath,
            content: svgContent,
            url: objectUrl
          });
          
          successful.push({
            id: icon.id,
            url: objectUrl,
            localPath: filePath,
            svg: svgContent
          });
        } catch (error) {
          console.error(`Failed to download icon ${icon.id}:`, error);
          failed.push(`Icon ${icon.id}`);
        }
      }
      
      return { successful, failed };
    } catch (error) {
      console.error('Error processing icons:', error);
      return { 
        successful, 
        failed: icons.map(icon => `Icon ${icon.id}`) 
      };
    }
  }
  
  private processFonts(fonts: string[]): {
    downloadedFonts: Array<{
      family: string;
      url?: string;
      localPath?: string;
      isGoogle?: boolean;
      isSystem?: boolean;
    }>;
    missingFonts: string[];
  } {
    const downloadedFonts: Array<{
      family: string;
      url?: string;
      localPath?: string;
      isGoogle?: boolean;
      isSystem?: boolean;
    }> = [];
    
    const missingFonts: string[] = [];
    const systemFonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New',
      'Courier', 'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman',
      'Tahoma', 'Trebuchet MS', 'Arial Black', 'Impact', 'Comic Sans MS'
    ];
    
    const googleFonts = [
      'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Roboto Condensed',
      'Oswald', 'Source Sans Pro', 'Slabo 27px', 'Raleway', 'PT Sans',
      'Roboto Slab', 'Merriweather', 'Ubuntu', 'Noto Sans', 'Playfair Display'
    ];
    
    fonts.forEach(font => {
      if (systemFonts.includes(font) || systemFonts.some(sf => font.startsWith(sf))) {
        downloadedFonts.push({
          family: font,
          isSystem: true
        });
      } else if (googleFonts.includes(font) || googleFonts.some(gf => font.startsWith(gf))) {
        const googleFontUrl = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
        downloadedFonts.push({
          family: font,
          url: googleFontUrl,
          isGoogle: true
        });
      } else {
        missingFonts.push(font);
      }
    });
    
    return { downloadedFonts, missingFonts };
  }
  
  // Get file contents from virtual file system
  getFile(path: string): VirtualFile | undefined {
    return this.virtualFileSystem.find(file => file.path === path);
  }
  
  // Get all files
  getAllFiles(): VirtualFile[] {
    return this.virtualFileSystem;
  }
  
  // Add a manually uploaded file
  addFile(file: File, type: 'images' | 'icons' | 'fonts'): Promise<VirtualFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const content = reader.result as ArrayBuffer;
        const fileName = file.name;
        const filePath = `assets/${type}/${fileName}`;
        const objectUrl = URL.createObjectURL(file);
        
        const virtualFile: VirtualFile = {
          name: fileName,
          path: filePath,
          content,
          url: objectUrl
        };
        
        this.virtualFileSystem.push(virtualFile);
        resolve(virtualFile);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }
}