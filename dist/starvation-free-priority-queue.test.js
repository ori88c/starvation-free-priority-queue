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
const starvation_free_priority_queue_1 = require("./starvation-free-priority-queue");
describe('StarvationFreePriorityQueue tests', () => {
    describe('Happy path tests', () => {
        test('push all items in ascending order, then pop all items, ' +
            'expecting a descending order of priorities per batch', async () => {
            const maxDeferment = 48;
            const batchSize = maxDeferment + 1;
            const lastBatchSize = 25;
            const fullBatchesCount = 34;
            const itemsCount = (batchSize * fullBatchesCount) + lastBatchSize;
            const priorityQueue = new starvation_free_priority_queue_1.StarvationFreePriorityQueue(maxDeferment, (task) => task.priority, itemsCount // Max capacity is known in advance.
            );
            let expectedSize = 0;
            const validateSize = () => {
                expect(priorityQueue.size).toBe(expectedSize);
                expect(priorityQueue.isEmpty).toBe(expectedSize === 0);
            };
            // Push items in ascending order: 1,2,3,...,itemsCount.
            for (let currPriority = 1; currPriority <= itemsCount; ++currPriority) {
                priorityQueue.push({ priority: currPriority });
                ++expectedSize;
                validateSize();
            }
            let expectedNextRemovedPriority;
            const popAndValidate = () => {
                const item = priorityQueue.pop();
                expect(item.priority).toBe(expectedNextRemovedPriority);
                --expectedNextRemovedPriority;
                --expectedSize;
                validateSize();
            };
            // Validate full batches.
            for (let currBatch = 1; currBatch <= fullBatchesCount; ++currBatch) {
                expectedNextRemovedPriority = currBatch * batchSize;
                for (let ithPopFromBatch = 1; ithPopFromBatch <= batchSize; ++ithPopFromBatch) {
                    popAndValidate();
                }
            }
            // Validate the last (partial) batch.
            expectedNextRemovedPriority = itemsCount;
            for (let ithPopFromBatch = 1; ithPopFromBatch <= lastBatchSize; ++ithPopFromBatch) {
                popAndValidate();
            }
            expect(priorityQueue.isEmpty).toBe(true);
        });
        test('after processing a batch for removal (even without reaching Max Deferment), ' +
            'newer higher-priority items are not removed until the batch is fully exhausted', async () => {
            const maxDeferment = 451;
            const popAfterKPushes = 306;
            const maxPriorityInTest = 2000;
            const priorityQueue = new starvation_free_priority_queue_1.StarvationFreePriorityQueue(maxDeferment, (priority) => priority);
            let expectedSize = 0;
            const validateSize = () => {
                expect(priorityQueue.size).toBe(expectedSize);
                expect(priorityQueue.isEmpty).toBe(expectedSize === 0);
            };
            // Push items in ascending order: 1,2,3,...,popAfterKPushes.
            for (let currPriority = 1; currPriority <= popAfterKPushes; ++currPriority) {
                priorityQueue.push(currPriority);
                ++expectedSize;
                validateSize();
            }
            // The first pop operation initiates Frontier formation.
            let expectedNextRemovedPriority = popAfterKPushes;
            for (let ithPopFromFrontier = 1; ithPopFromFrontier <= popAfterKPushes; ++ithPopFromFrontier) {
                const removedPriority = priorityQueue.pop();
                expect(removedPriority).toBe(expectedNextRemovedPriority);
                --expectedNextRemovedPriority;
                // Add "noise" by pushing items before fully exhausting the current frontier.
                // These new items are ignored until the current frontier is fully processed.
                priorityQueue.push(maxPriorityInTest);
                validateSize();
            }
            while (!priorityQueue.isEmpty) {
                expect(priorityQueue.pop()).toBe(maxPriorityInTest);
                --expectedSize;
                validateSize();
            }
        });
        test('the clear method should empty the priority queue by removing all items', async () => {
            const irrelevantMaxDeferment = 293;
            const itemsCount = 890;
            const priorityQueue = new starvation_free_priority_queue_1.StarvationFreePriorityQueue(irrelevantMaxDeferment, (priority) => priority);
            // Push items in ascending order: 1,2,3,...,itemsCount.
            for (let currPriority = 1; currPriority <= itemsCount; ++currPriority) {
                priorityQueue.push(currPriority);
            }
            expect(priorityQueue.size).toBe(itemsCount);
            priorityQueue.clear();
            expect(priorityQueue.size).toBe(0);
            expect(priorityQueue.isEmpty).toBe(true);
            expect(() => priorityQueue.pop()).toThrow();
        });
    });
    describe('Negative path tests', () => {
        test('constructor should throw an error if the maxDeferment is not a natural number', () => {
            const getPriority = (priority) => priority;
            const nonNaturalNumbers = [-74, -65, -5.67, -0.00001, 0, 0.1, 0.08974, 9.543, 1898.5, 4000.0000001];
            for (const invalidMaxDeferment of nonNaturalNumbers) {
                expect(() => new starvation_free_priority_queue_1.StarvationFreePriorityQueue(invalidMaxDeferment, getPriority)).toThrow();
            }
        });
        test('constructor should throw an error if the estimatedMaxCapacity is provided ' +
            'but is not a natural number', () => {
            const maxDeferment = 50;
            const getPriority = (priority) => priority;
            const nonNaturalNumbers = [-74, -65, -5.67, -0.00001, 0, 0.1, 0.08974, 9.543, 1898.5, 4000.0000001];
            for (const invalidMaxCapacity of nonNaturalNumbers) {
                expect(() => new starvation_free_priority_queue_1.StarvationFreePriorityQueue(maxDeferment, getPriority, invalidMaxCapacity)).toThrow();
            }
        });
        test('pop operation should throw an error when the priority queue is empty', () => {
            const maxDeferment = 74;
            const estimatedMaxCapacity = 250;
            const getPriority = (priority) => priority;
            const priorityQueue = new starvation_free_priority_queue_1.StarvationFreePriorityQueue(maxDeferment, getPriority, estimatedMaxCapacity);
            const popAttemptsCount = 365;
            for (let ithAttempt = 1; ithAttempt <= popAttemptsCount; ++ithAttempt) {
                expect(() => priorityQueue.pop()).toThrow();
            }
        });
    });
});
//# sourceMappingURL=starvation-free-priority-queue.test.js.map