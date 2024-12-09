// Performance Monitoring Utilities
export class PerformanceMonitor {
  private static startTimes: Map<string, number> = new Map();
  private static metrics: Map<string, number[]> = new Map();

  static start(key: string): void {
    this.startTimes.set(key, performance.now());
  }

  static end(key: string): number {
    const startTime = this.startTimes.get(key);
    if (!startTime) {
      console.warn(`No start time found for ${key}`);
      return -1;
    }

    const duration = performance.now() - startTime;
    
    // Store metrics
    const existingMetrics = this.metrics.get(key) || [];
    existingMetrics.push(duration);
    this.metrics.set(key, existingMetrics);

    return duration;
  }

  static getAverageTime(key: string): number {
    const metrics = this.metrics.get(key);
    if (!metrics || metrics.length === 0) return -1;

    return metrics.reduce((a, b) => a + b, 0) / metrics.length;
  }

  static logPerformance(key: string): void {
    const avgTime = this.getAverageTime(key);
    console.log(`Performance for ${key}:`, {
      averageTime: avgTime.toFixed(2) + 'ms',
      totalMeasurements: this.metrics.get(key)?.length || 0
    });
  }

  static resetMetrics(key?: string): void {
    if (key) {
      this.metrics.delete(key);
      this.startTimes.delete(key);
    } else {
      this.metrics.clear();
      this.startTimes.clear();
    }
  }
}

// Decorator for performance tracking
export function TrackPerformance() {
  return function (
    target: any, 
    propertyKey: string, 
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      PerformanceMonitor.start(propertyKey);
      
      try {
        const result = originalMethod.apply(this, args);
        
        // Handle promise-based methods
        if (result instanceof Promise) {
          return result.finally(() => {
            PerformanceMonitor.end(propertyKey);
          });
        }
        
        PerformanceMonitor.end(propertyKey);
        return result;
      } catch (error) {
        PerformanceMonitor.end(propertyKey);
        throw error;
      }
    };

    return descriptor;
  };
}

// React Component Performance Wrapper
export function withPerformanceMonitoring<P>(
  WrappedComponent: React.ComponentType<P>
) {
  return class extends React.Component<P> {
    private renderStartTime: number = 0;

    componentDidMount() {
      this.renderStartTime = performance.now();
    }

    componentDidUpdate() {
      const renderTime = performance.now() - this.renderStartTime;
      if (renderTime > 50) { // Log if render takes more than 50ms
        console.warn(`Slow render for ${WrappedComponent.name}:`, renderTime);
      }
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}
