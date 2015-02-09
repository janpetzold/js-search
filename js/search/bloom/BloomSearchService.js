angular.module('search').factory('BloomSearchService', ['$rootScope', function BloomSearchService($rootScope) {
	return {
		workerCount: 0,
		workerResults: [],
		startSearch: null,

		workers: [],

		initWorkerArray: function(dataset) {
			var startWebWorker = new Date().getTime();

			// Initialize the WebWorker
			var worker1 = new Worker('js/search/bloom/BloomSearchWorker.js');
			var worker2 = new Worker('js/search/bloom/BloomSearchWorker.js');
			var worker3 = new Worker('js/search/bloom/BloomSearchWorker.js');
			var worker4 = new Worker('js/search/bloom/BloomSearchWorker.js');

			this.workers =[worker1, worker2, worker3, worker4];

			// add event listener to WebWorkers
			this.addEventListenersForWorkers(this.workers);

			console.log('Ramp-up WebWorkers took ' + (new Date().getTime() - startWebWorker) + 'ms');

			var slicedDataset = this.getSlicedDataset(dataset);

			var startMessaging = new Date().getTime();

			worker1.postMessage(this.getWebWorkerInitMessage(0, slicedDataset));
			worker2.postMessage(this.getWebWorkerInitMessage(1, slicedDataset));
			worker3.postMessage(this.getWebWorkerInitMessage(2, slicedDataset));
			worker4.postMessage(this.getWebWorkerInitMessage(3, slicedDataset));

			console.log('Messaging to WebWorkers took ' + (new Date().getTime() - startMessaging) + 'ms');
		},

		addEventListenersForWorkers: function(workers) {
			for(var i = 0; i < workers.length; i++) {
				workers[i].addEventListener('message', this.handleResult, false);
				workers[i].addEventListener('error', this.handleError, false);
			}
		},

		resetWorkerCount: function() {
			this.workerCount = 0;
			this.workerResults = [];
			this.startSearch = new Date().getTime();
		},

		handleResult: function(workerResult) {		
			$rootScope.$broadcast('BLOOM_FILTER_WORKERS_RESULT', workerResult);
			/*
			var self = this;
			self.workerCount++;

			if(workerResult.data.length > 0) {
				self.workerResults.push(workerResult.data);
			}
		
			if(this.workerCount >= 4) {
				// all workers will return their workerResults in an array so merge them
				var dataset = self.mergeBloomResults(self.workerResults);
				$rootScope.$broadcast('BLOOM_FILTER_WORKERS_RESULT', dataset);

				console.log('All results received - Bloom WebWorker search took ' + (new Date().getTime() - this.startSearch) + 'ms and found ' + dataset.length + ' results');
			}
			*/
		},

		handleError: function() {
			console.log('Error retrieved.');
			console.log(arguments);
		},

		/**
		  * Takes a given dataset (array) and creates a Bloom filter for each entry
		  */
		initBloomData: function(dataset) {
			var result = [],
				datasetLength = dataset.length;

			for(var i = 0; i < datasetLength; i++) {
				var bloom = new BloomFilter(32 * 256, 6);

				bloom.add(dataset[i].lastName);
				bloom.add(dataset[i].firstName);
				bloom.add(dataset[i].street);
				bloom.add(dataset[i].zipCode);
				bloom.add(dataset[i].city);
				bloom.add(dataset[i].stateName);
				bloom.add(dataset[i].emailAddress);
				bloom.add(dataset[i].phone);
				bloom.add(dataset[i].dateOfBirthFormatted);

				result.push(bloom);
			}

			return result;
		},

		search: function(term) {
			for(var i = 0; i < this.workers.length; i++) {
				this.workers[i].postMessage({
					'type': 'search',
					'term': term
				});
			}
		},

		getSlicedDataset: function(dataset) {
			var datasetLength = dataset.length;

			var slicedDataset = [
				dataset.slice(0, datasetLength / 4),
				dataset.slice(datasetLength / 4, datasetLength / 2),
				dataset.slice(datasetLength / 2, (datasetLength / 4) * 3),
				dataset.slice((datasetLength / 4) * 3, datasetLength),
			];

			return slicedDataset;
		},

		getWebWorkerInitMessage: function(offset, dataset) {
			return {
				'type': 'init',
				'originalDataset': dataset[offset]
			};
		},

		mergeBloomResults: function(data) {
			var result = [];
			for(var i = 0; i < data.length; i++) {
				if(data[i].length > 0) {
					result = result.concat(data[i]);
				}
			}
			return result;
		}
	}
}]);