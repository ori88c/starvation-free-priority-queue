"use strict";
/**
 * Copyright 2024 Ori Cohen https://github.com/ori88c
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StarvationFreePriorityQueue = void 0;
const data_oriented_slim_queue_1 = require("data-oriented-slim-queue");
/**
 * StarvationFreePriorityQueue
 *
 * The `StarvationFreePriorityQueue` class implements an in-memory priority queue designed to mitigate
 * the issue of starvation—where low-priority items may never be processed due to the continuous arrival
 * of higher-priority items. It achieves this by balancing two key factors:
 * - **Priority**: Represented by a numeric value.
 * - **Arrival time**: Ensures fairness for items that have waited longer.
 *
 * This balanced approach makes the implementation ideal for task scheduling where fairness is critical,
 * though it may not be suitable for greedy algorithms such as Dijkstra's algorithm.
 *
 * ### Algorithm
 * The balance between priority and arrival time is achieved through the following data structures:
 * - **FIFO Queue**: Holds all pending items in their order of arrival.
 * - **Priority Frontier**: A sorted array representing the **next batch** of items ready for removal,
 *   prioritized by their numeric priority value.
 *
 * **Push and Pop Operations**:
 * - **Pushing Items**: New items are added to the FIFO Queue.
 * - **Popping Items**:
 *   - If the Priority Frontier contains items, the top (highest-priority) item is removed and returned,
 *     prioritizing the priority attribute greedily within each batch.
 *   - If the Priority Frontier is empty, up to `_maxDeferment + 1` items are pulled from the FIFO Queue,
 *     sorted by priority, and moved to the Priority Frontier for removal. This ensures fairness by
 *     accounting for the order of arrival.
 *
 * ### Starvation Coefficient - Maximum Deferment
 * Low-priority items can be delayed by **at most** `maxDeferment` pop attempts, as defined by the user.
 * This ensures fairness while maintaining the priority order, provided that `maxDeferment` is not exceeded.
 *
 * ### Complexity
 * - **Push**: O(1).
 * - **Pop**:
 *   - **Amortized**: O(log(maxDeferment)).
 *   - **Best case**: O(1).
 *   - **Worst case**: O(maxDeferment * log(maxDeferment)) when a new frontier is populated.
 *
 * ### Example Use Cases
 * - Task scheduling where fairness is critical but priority remains significant.
 * - Resource allocation systems requiring bounded delays for low-priority tasks.
 */
class StarvationFreePriorityQueue {
    /**
     * Constructor
     *
     * The `StarvationFreePriorityQueue` constructor provides precise control over the
     * Starvation Coefficient (Maximum Deferment), determining the maximum number of
     * 'pop' operations during which low-priority items can be delayed by higher-priority items.
     *
     * @param maxDeferment The maximum number of 'pop' operations a low-priority item
     *                      can be delayed by higher-priority items within the same batch.
     * @param getPriority A callback function to extract the priority of an item.
     *                     Larger numeric values indicate higher priority.
     * @param estimatedMaxCapacity An estimate of the queue's maximum capacity, representing
     *                             the expected backpressure of items waiting to be removed
     *                             by the 'pop' operation. This serves as an optimization
     *                             parameter, as higher estimates reduce the frequency of
     *                             dynamic memory allocations at runtime.
     */
    constructor(maxDeferment, getPriority, estimatedMaxCapacity) {
        this._priorityFrontier = []; // Frontier of items ready to be removed, sorted by ascending priority.
        if (!isNaturalNumber(maxDeferment)) {
            throw new Error(`Failed to instantiate StarvationFreePriorityQueue: maxDeferment must ` +
                `be a natural number, but received ${maxDeferment}`);
        }
        if (estimatedMaxCapacity && !isNaturalNumber(estimatedMaxCapacity)) {
            throw new Error(`Failed to instantiate StarvationFreePriorityQueue: estimatedMaxCapacity must ` +
                `be a natural number, but received ${estimatedMaxCapacity}`);
        }
        this._maxDeferment = maxDeferment;
        this._pendingItemsQueue = new data_oriented_slim_queue_1.SlimQueue(estimatedMaxCapacity);
        this._ascByPriorityComparer = (item1, item2) => getPriority(item1) - getPriority(item2);
    }
    /**
     * size
     *
     * @returns The number of items currently stored in the priority queue.
     */
    get size() {
        return this._pendingItemsQueue.size + this._priorityFrontier.length;
    }
    /**
     * isEmpty
     *
     * @returns True if and only if the queue does not contain any item.
     */
    get isEmpty() {
        return this._pendingItemsQueue.size === 0 && this._priorityFrontier.length === 0;
    }
    /**
     * push
     *
     * Appends an item to the end of the queue (i.e., the Last In), increasing its size by one.
     *
     * ### Complexity
     * O(1) under normal conditions. However, if the internal FIFO Queue capacity is exceeded,
     * a reallocation occurs, which can temporarily increase latency. This behavior may result
     * in latency spikes during the warm-up period. To mitigate this, consider setting the
     * optional `estimatedMaxCapacity` parameter in the constructor.
     *
     * @param item The item to add as the newest entry in the queue (i.e., the Last In).
     */
    push(item) {
        this._pendingItemsQueue.push(item);
    }
    /**
     * pop
     *
     * Removes and returns the most prioritized item from the current batch, decreasing the queue's
     * size by one.
     *
     * ### Algorithm
     * - If the Priority Frontier is empty, up to `_maxDeferment + 1` items are pulled from the FIFO
     *   Queue and moved to the Priority Frontier. Once shifted, the items in the Priority Frontier
     *   are sorted by priority.
     * - The top (highest-priority) item is then removed from the Priority Frontier and returned.
     *
     * ### Complexity
     * - **Amortized**: O(log(maxDeferment)).
     * - **Best case**: O(1).
     * - **Worst case**: O(maxDeferment * log(maxDeferment)) when a new frontier is populated.
     *
     * @returns The item that was removed from the queue.
     * @throws Error if the queue is empty.
     */
    pop() {
        if (this._priorityFrontier.length > 0) {
            return this._priorityFrontier.pop();
        }
        if (this._pendingItemsQueue.size === 0) {
            throw new Error('Cannot perform a pop operation on an empty StarvationFreePriorityQueue');
        }
        // Populate the frontier, representing the current batch of prioritized items to be removed first.
        // Unlike a typical priority queue, this approach considers *both* the waiting time of items 
        // and their raw priority attribute. This mechanism ensures *limited aging* of items in the queue.
        for (let movedCount = 0; movedCount <= this._maxDeferment && !this._pendingItemsQueue.isEmpty; ++movedCount) {
            const oldestPendingItem = this._pendingItemsQueue.pop();
            this._priorityFrontier.push(oldestPendingItem);
        }
        this._priorityFrontier.sort(this._ascByPriorityComparer);
        return this._priorityFrontier.pop();
    }
    /**
     * clear
     *
     * Removes all items from the queue, leaving it empty.
     */
    clear() {
        this._pendingItemsQueue.clear();
        while (this._priorityFrontier.length > 0) {
            this._priorityFrontier.pop();
        }
    }
}
exports.StarvationFreePriorityQueue = StarvationFreePriorityQueue;
function isNaturalNumber(num) {
    const floored = Math.floor(num);
    return floored >= 1 && floored === num;
}
//# sourceMappingURL=starvation-free-priority-queue.js.map