/**
 * Performance Metrics & Monitoring
 */

interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

class PerformanceMetrics {
  private metrics: Metric[] = [];
  private maxSize = 1000;

  record(name: string, value: number, unit: string = 'ms') {
    this.metrics.push({
      name,
      value,
      unit,
      timestamp: Date.now(),
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxSize) {
      this.metrics = this.metrics.slice(-this.maxSize);
    }
  }

  getMetrics(name?: string) {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return this.metrics;
  }

  getAverage(name: string): number {
    const relevant = this.metrics.filter(m => m.name === name);
    if (relevant.length === 0) return 0;
    const sum = relevant.reduce((acc, m) => acc + m.value, 0);
    return sum / relevant.length;
  }

  getPercentile(name: string, percentile: number): number {
    const relevant = this.metrics.filter(m => m.name === name);
    if (relevant.length === 0) return 0;

    const sorted = relevant.map(m => m.value).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  getSummary(name: string) {
    const relevant = this.metrics.filter(m => m.name === name);
    return {
      count: relevant.length,
      min: Math.min(...relevant.map(m => m.value)),
      max: Math.max(...relevant.map(m => m.value)),
      avg: this.getAverage(name),
      p95: this.getPercentile(name, 95),
      p99: this.getPercentile(name, 99),
    };
  }

  clear() {
    this.metrics = [];
  }
}

export const metrics = new PerformanceMetrics();
