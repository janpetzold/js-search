angular.module('search').factory('BloomSearchService', ['$rootScope', 'LogService', function BloomSearchService($rootScope, LogService) {
	return {
		workerCount: 0,
		workerResults: [],

		workers: [],

		initWorkerArray: function(dataset) {
			var bloomRampUpBench = LogService.startBenchmark('Ramp-up WebWorkers');

			// Initialize the WebWorker
			var worker1 = new Worker('js/search/bloom/BloomSearchWorker.js');
			var worker2 = new Worker('js/search/bloom/BloomSearchWorker.js');
			var worker3 = new Worker('js/search/bloom/BloomSearchWorker.js');
			var worker4 = new Worker('js/search/bloom/BloomSearchWorker.js');

			this.workers =[worker1, worker2, worker3, worker4];

			// add event listener to WebWorkers
			this.addEventListenersForWorkers(this.workers);

			LogService.stopBenchmark(bloomRampUpBench);

			var slicedDataset = this.getSlicedDataset(dataset);

			var bloomMessagingBench = LogService.startBenchmark('Sending data to WebWorkers');

			worker1.postMessage(this.getWebWorkerInitMessage(0, slicedDataset));
			worker2.postMessage(this.getWebWorkerInitMessage(1, slicedDataset));
			worker3.postMessage(this.getWebWorkerInitMessage(2, slicedDataset));
			worker4.postMessage(this.getWebWorkerInitMessage(3, slicedDataset));

			LogService.startBenchmark(bloomMessagingBench);
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
		},

		handleResult: function(workerResult) {		
			$rootScope.$broadcast('BLOOM_FILTER_WORKERS_RESULT', workerResult);
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

			// determine bit size for BloomFilter - 2% error tolerance are generally fine
			var bits = datasetLength * 8;

			// be far more restrictive for bigger result sets - works pretty well
			if(datasetLength > 99999) {
				bits = datasetLength / 100;
			}

			for(var i = 0; i < datasetLength; i++) {
				var bloom = new BloomFilter(bits, 6);

				bloom.add(dataset[i].lastName);
				bloom.add(dataset[i].firstName);
				bloom.add(dataset[i].street);
				bloom.add(dataset[i].zip);
				bloom.add(dataset[i].city);
				bloom.add(dataset[i].stateName);
				bloom.add(dataset[i].email);
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

			return [
				dataset.slice(0, datasetLength / 4),
				dataset.slice(datasetLength / 4, datasetLength / 2),
				dataset.slice(datasetLength / 2, (datasetLength / 4) * 3),
				dataset.slice((datasetLength / 4) * 3, datasetLength)
			];
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
	};
}]);