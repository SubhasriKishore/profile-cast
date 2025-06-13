import Vapi from '@vapi-ai/web';

type CleanupFunction = () => void;

interface Resource {
  cleanup?: CleanupFunction;
  destroy?: CleanupFunction;
  dispose?: CleanupFunction;
  stop?: CleanupFunction;
}

export class ResourceCleanup {
  private static instance: ResourceCleanup;
  private resources: Map<string, Resource | Vapi> = new Map();
  private vapi: Vapi | null = null;

  public static getInstance(): ResourceCleanup {
    if (!ResourceCleanup.instance) {
      ResourceCleanup.instance = new ResourceCleanup();
    }
    return ResourceCleanup.instance;
  }

  public registerResource(id: string, resource: Resource | Vapi): void {
    if (resource instanceof Vapi) {
      this.vapi = resource;
    } else {
      this.resources.set(id, resource);
    }
  }

  public cleanup(): void {
    // Cleanup Vapi instance
    if (this.vapi) {
      this.vapi.stop();
      this.vapi = null;
    }

    // Cleanup other resources
    this.resources.forEach(resource => {
      if (resource instanceof Vapi) {
        resource.stop();
      } else {
        if (typeof resource.stop === 'function') {
          resource.stop();
        } else if (typeof resource.cleanup === 'function') {
          resource.cleanup();
        } else if (typeof resource.destroy === 'function') {
          resource.destroy();
        } else if (typeof resource.dispose === 'function') {
          resource.dispose();
        }
      }
    });
    this.resources.clear();
  }
} 