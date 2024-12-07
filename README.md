<h2 align="middle">Starvation Free Priority Queue</h2>

The `StarvationFreePriorityQueue` class implements an in-memory priority queue designed to mitigate the issue of **starvation** — where low-priority items may never be processed due to the continuous arrival of higher-priority items. It achieves this by balancing two key factors:
- __Priority__: Represented by a numeric value.
- __Arrival time__: Ensures fairness for items that have waited longer. Low-priority items can be delayed by **at most** `maxDeferment` pop attempts, as defined by the user.

This balanced approach ensures fairness while maintaining the priority order, provided that `maxDeferment` is not exceeded. In essence, priority is honored within batches, with each batch consisting of the oldest `maxDeferment + 1` items in the queue. This implementation is ideal for **task scheduling** scenarios where fairness is paramount, as well as for resource allocation systems that require **bounded delays** for low-priority tasks.

## Table of Contents :bookmark_tabs:

* [Key Features](#key-features)
* [Algorithm](#algorithm)
* [Comparison with traditional Aging Techniques](#comparison)
* [API](#api)
* [Getter Methods](#getter-methods)
* [Use Case Example: Task Scheduling in CI/CD Pipelines](#use-case-example)
* [License](#license)

## Key Features :sparkles:<a id="key-features"></a>

- __Starvatopm Free__: A user-defined `maxDeferment` parameter ensures that low-priority items are delayed by **no more than** `maxDeferment` pop attempts. This balanced approach makes the implementation ideal for task scheduling where fairness is critical, while still honoring priorities, however in batches which are determined according to arrival time.
- __Efficiency :gear:__: The push operation has a worst-case complexity of O(1). The pop operation features amortized complexity of O(log(`maxDeferment`)), a best-case complexity of O(1), and a worst-case complexity of O(`maxDeferment` * log(`maxDeferment`)) when a new frontier is populated.
- __Comprehensive Documentation :books:__: The class is thoroughly documented, enabling IDEs to provide helpful tooltips that enhance the coding experience.
- __Tests :test_tube:__: **Fully covered** by comprehensive unit tests.
- **TypeScript** support.
- ES2020 Compatibility: The `tsconfig` target is set to ES2020, ensuring compatibility with ES2020 environments.

## Algorithm :gear:<a id="algorithm"></a>

The balance between priority and arrival time is achieved through the following data structures:
* __FIFO Queue__: Holds all pending items in their order of arrival.
* __Priority Frontier__: A sorted array representing the **next batch** of items ready for removal, prioritized by their numeric priority value.

New items are added to a FIFO queue, and items are popped based on the following policy:
* If the Priority Frontier contains items, the top (highest-priority) item is removed and returned, prioritizing the priority attribute greedily within each batch.
* If the Priority Frontier is empty, up to `_maxDeferment + 1` items are pulled from the FIFO Queue, sorted by priority, and moved to the Priority Frontier for removal. This ensures fairness by accounting for the order of arrival.

## Comparison with traditional Aging Techniques :balance_scale:<a id="comparison"></a>

Traditional [aging algorithms](https://en.wikipedia.org/wiki/Aging_(scheduling)) typically increase an item's priority over time. In contrast, this package employs a **bounded deferment** strategy, ensuring that an item is delayed by no more than a fixed number of pops. While it is not a classic aging algorithm, it achieves a similar effect and can be regarded as a tailored aging mechanism designed for bounded, starvation-free behavior.

## API :globe_with_meridians:<a id="api"></a>

The `StarvationFreePriorityQueue` class provides the following methods:

* __constructor__:
  * Configures the `maxDeferment` parameter to define the maximum allowable delay for low-priority items.
  * Accepts a `getPriority` parameter, a function used to associate items with their corresponding priorities (**higher numeric values indicate higher priority**).
  * Includes an optional `estimatedMaxCapacity` parameter to enable pre-allocated memory if the user knows the maximum number of items to be stored in advance. This serves as a non-mandatory optimization, reducing dynamic allocations during runtime.
* __push__: Appends an item to the end of the queue (i.e., the Last In), increasing its size by one.
* __pop__: Removes and returns the most prioritized item from the current frontier, decreasing the queue's size by one.
* __clear__: Removes all items from the queue, leaving it empty.

If needed, refer to the code documentation for a more comprehensive description.

## Getter Methods :mag:<a id="getter-methods"></a>

The `StarvationFreePriorityQueue` class provides the following getter methods to reflect the current state:

* __size__: The number of items currently stored in the priority queue.
* __isEmpty__: True if and only if the queue does not contain any item.

To eliminate any ambiguity, all getter methods have **O(1)** time and space complexity.

## Use Case Example: Task Scheduling in CI/CD Pipelines :man_technologist:<a id="use-case-example"></a>

Consider a CI/CD Pipelines Manager component designed to prioritize high-priority builds while ensuring that low-priority builds are not starved, maintaining bounded delays within deployment **cycles**. A deployment cycle is defined by the current **frontier** (the prioritized batch) of the priority queue.

```ts
import { StarvationFreePriorityQueue } from 'starvation-free-priority-queue';

interface PipelineTask {
  id: string;
  priority: number;
}

class CICDPipelinesManager {
  private readonly _queue: StarvationFreePriorityQueue<PipelineTask>;
  private _currentlyProcessingTasks: number = 0;

  constructor(
    maxDeferment: number,
    estimatedMaxPendingTasks?: number
  ) {
    this._queue = new StarvationFreePriorityQueue<PipelineTask>(
      maxDeferment,
      task => task.priority,
      estimatedMaxPendingTasks
    );
  }

  public get pendingTasks(): number {
    return this._queue.size;
  }

  public get processingTasks(): number {
    return this._currentlyProcessingTasks;
  } 

  public addTask(task: Readonly<PipelineTask>): void {
    this._queue.push(task);
  }

  public async processNextTask(): Promise<void> {
    const task = this._queue.pop();
    ++this._currentlyProcessingTasks;
    await this.processTask(task);
    --this._currentlyProcessingTasks;
  }

  public clearAllTasks(): void {
    this._queue.clear();
  }

  private async processTask(task: Readonly<PipelineTask>): Promise<void> {
    // Implementation for task execution would go here.
  }
}
```

Note that a real-world CI/CD Pipeline Manager must also handle task dependencies, ensuring that certain tasks are not executed until their prerequisites are complete. However, this is beyond the scope of this example.  
Additionally, it is advisable to limit the number of concurrently executing tasks to prevent resource exhaustion. This can be achieved using a semaphore, such as [zero-backpressure-semaphore-typescript](https://www.npmjs.com/package/zero-backpressure-semaphore-typescript) or [zero-backpressure-weighted-promise-semaphore](https://www.npmjs.com/package/zero-backpressure-weighted-promise-semaphore).

## License :scroll:<a id="license"></a>

[Apache 2.0](LICENSE)
