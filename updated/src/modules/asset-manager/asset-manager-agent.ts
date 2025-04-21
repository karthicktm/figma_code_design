// src/modules/asset-manager/asset-manager-agent.ts
import { AssetManagerResult, DesignInputResult } from '@/types/agent-interfaces';

// In browser environment, we can't use Node's fs module
// Instead, we'll use browser APIs and simulate a file system
interface VirtualFile {
  name: string;
  path: string;
  content: ArrayBuffer | string;
  url: string; // URL.createObjectURL result
}

export class AssetManagerAgent {
  private apiKey: string;
  private fileId: string;
  private virtualFileSystem: VirtualFile[] = [];
  private onProgress?: (progress: number) => void;
  
  constructor(
    apiKey: string,
    fileId: string,
    onProgress?: (progress: number) => void
  ) {
    this.apiKey = apiKey;
    this.fileId = fileId;
    this.onProgress = onProgress;
  }
  
  async execute(designInput: DesignInputResult): Promise<AssetManagerResult> {
    try {
      this.updateProgress(5);
      
      // Process and download images
      this.updateProgress(10);
      const downloadedImages = await this.processImages(designInput);
      this.updateProgress(40);
      
      // Process and download icons
      const downloadedIcons = await this.processIcons(designInput);
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
      throw new Error(`Failed to manage assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private updateProgress(progress: number) {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }
  
  private async processImages(
    designInput: DesignInputResult
  ): Promise<{ 
    successful: Array<{ id: string; url: string; localPath: string }>;
    failed: string[];
  }> {
    const successful: Array<{ id: string; url: string; localPath: string }> = [];
    const failed: string[] = [];
    
    if (!designInput.assets.images || designInput.assets.images.length === 0) {
      return { successful, failed };
    }
    
    // In a real implementation, we would download the actual images
    // For this demo, we'll simulate the process with mock data
    
    // Simulate a mix of successful and failed downloads
    for (let i = 0; i < designInput.assets.images.length; i++) {
      const image = designInput.assets.images[i];
      
      // Simulate 80% success rate
      if (Math.random() < 0.8) {
        // Create a mock successful download
        successful.push({
          id: image.nodeId,
          url: `https://placekitten.com/200/300?image=${i}`, // Placeholder image URL
          localPath: `assets/images/image_${image.nodeId.replace(':', '_')}.png`
        });
        
        // Add a small delay to simulate network request
        await new Promise(resolve => setTimeout(resolve, 50));
      } else {
        // Simulate a failed download
        failed.push(`Image ${image.nodeId}`);
      }
    }
    
    return { successful, failed };
  }
  
  private async processIcons(
    designInput: DesignInputResult
  ): Promise<{ 
    successful: Array<{ id: string; url: string; localPath: string; svg?: string }>;
    failed: string[];
  }> {
    // For now, let's use a simple heuristic to identify icons
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
    
    // Simulate downloading icons with mock data
    for (let i = 0; i < icons.length; i++) {
      const icon = icons[i];
      
      // Simulate 70% success rate
      if (Math.random() < 0.7) {
        // Create a mock successful download
        successful.push({
          id: icon.id,
          url: `https://fakeimg.pl/24x24/?text=icon&font=lobster`, // Placeholder icon URL
          localPath: `assets/icons/icon_${icon.name.replace(/\s+/g, '_').toLowerCase()}_${icon.id.replace(':', '_')}.svg`,
          svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" fill="#F2F2F2"/>
            <path d="M12 6L19.0622 18H4.93782L12 6Z" fill="#333333"/>
          </svg>`
        });
        
        // Add a small delay to simulate network request
        await new Promise(resolve => setTimeout(resolve, 30));
      } else {
        // Simulate a failed download
        failed.push(`Icon ${icon.id}`);
      }
    }
    
    return { successful, failed };
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
        // For demonstration, let's randomly determine if a font is missing
        if (Math.random() < 0.3) {
          missingFonts.push(font);
        } else {
          // Simulate a custom font
          downloadedFonts.push({
            family: font,
            localPath: `assets/fonts/${font.replace(/\s+/g, '_').toLowerCase()}.ttf`
          });
        }
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
