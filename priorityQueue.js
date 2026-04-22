/**
 * priorityQueue.js – Max-priority queue simulation
 *
 * CONCEPT: A priority queue keeps elements sorted so the highest-priority
 * item is always at the front. Here, priority = fill level percentage.
 * We simulate a max-heap by maintaining a sorted array.
 *
 * Time complexity of sort: O(n log n) — acceptable for typical bin counts.
 */

class PriorityQueue {
  constructor() {
    /** Internal heap array; each entry: { bin, priority } */
    this._heap = [];
  }

  /**
   * Insert a bin into the queue.
   * Priority is the fill level (0–100).
   */
  enqueue(bin) {
    this._heap.push({ bin, priority: bin.fill });
    // Re-sort descending by priority after each insert
    // (simulates bubble-up in a real max-heap)
    this._heap.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove and return the highest-priority bin (the fullest one).
   * Simulates extractMax in a max-heap.
   */
  dequeue() {
    return this._heap.shift(); // O(n) shift; fine for small n
  }

  /** Peek at the highest-priority bin without removing it. */
  peek() {
    return this._heap[0] || null;
  }

  /** Check if the queue is empty. */
  isEmpty() {
    return this._heap.length === 0;
  }

  /** Current size of the queue. */
  size() {
    return this._heap.length;
  }

  /** Return all items sorted by priority (for display). */
  toArray() {
    return [...this._heap];
  }

  /**
   * Build a priority queue from an array of bins.
   * Filters to only include bins above the given threshold.
   *
   * @param {Array} bins – Array of bin objects from BinStore
   * @param {number} threshold – Minimum fill % to include
   * @param {string} zone – Zone filter ('all' = no filter)
   */
  static build(bins, threshold = 0, zone = 'all') {
    const pq = new PriorityQueue();
    bins
      .filter(b => b.fill >= threshold)
      .filter(b => zone === 'all' || b.zone === zone)
      .forEach(b => pq.enqueue(b));
    return pq;
  }
}
