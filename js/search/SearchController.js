angular.module('search').controller('SearchController', ['$scope', '$http', 'SearchService', 'LogService', 'AngularFilterService', 'FuseService', 'BloomSearchService', 
	function SearchController($scope, $http, SearchService, LogService, AngularFilterService, FuseService, BloomSearchService) {

	var MAX_SEARCH_RESULTS = 1000;

	var self = this;
	self.initialDataset = [];

	// Default search volume
	self.amount = 1000;

	// Default search type
	self.type = 'Bloomfilter';
	self.term = '';
	self.webworkers = true;

	// store results from BloomFilter in Controller since they get updated via event
	self.bloomWorkerResults = [];

	self.logVisible = false;
	self.log = LogService;

	self.init = function() {
		var jsonBench = LogService.startBenchmark('Fetch JSON data');

		// load data
		$http.get('data/' + self.amount + '.json').success(function(data) {
			LogService.stopBenchmark(jsonBench);

			// set correct federal states and format birthday
			var startFormatting = new Date().getTime();
			for(var i = 0; i < data.length; i++) {
				data[i].stateName = SearchService.federalStates[data[i].state];
				data[i].dateOfBirthFormatted = SearchService.getFormattedDate(data[i].dateOfBirth);
			}

			// store initial dataset for later reference
			if(self.initialDataset.length == 0) {
				self.initialDataset = data;
			}

			console.log('Data formatted in ' + (new Date().getTime() - startFormatting));

			self.dataset = SearchService.limit(data, MAX_SEARCH_RESULTS);

			// Prepare Fuse data
			var startFuse = new Date().getTime();
			self.fuseDataset = FuseService.initFuseDataset(self.initialDataset);
			console.log('Fuse data prepared in ' + (new Date().getTime() - startFuse));

			// Prepare Bloom data
			var startBloom = new Date().getTime();

			self.bloomDataset = BloomSearchService.initBloomData(self.initialDataset);

			// if WebWorkers are enabled, split dataset in 4 parts since we say that we want foru threads to run in parallel
			if(self.webworkers) {
				BloomSearchService.initWorkerArray(self.initialDataset);
			}

			console.log('Bloom data prepared in ' + (new Date().getTime() - startBloom) + 'ms');
		})
	};

	self.changeAmount = function(newAmount) {
		self.amount = newAmount;

		if(newAmount > 100000) {
			self.type = 'Bloomfilter';
		}

		// Re-initialize controller
		self.initialDataset = [];
		self.term = '';
		self.init();
	}

	self.changeType = function(newType) {
		self.type = newType;

		// Re-initialize controller
		self.initialDataset = [];
		self.term = '';

		self.init();
	}

	self.search = function(term) {
		// Determine current type and search based on that choice
		if(self.type === 'Angular') {
			var startAngular = new Date().getTime();
			var result = AngularFilterService.filterItems(self.initialDataset, term);

			console.log('Angular search took ' + (new Date().getTime() - startAngular) + ', results: ' + result.length);

			self.dataset = SearchService.limit(result, MAX_SEARCH_RESULTS);
		} else if(self.type === 'Fuse') {
			if(self.term === '') {
				self.dataset = self.initialDataset;
			} else {
				var startFuse = new Date().getTime();

				var result = self.fuseDataset.search(term);	

				console.log('Fuse search took ' + (new Date().getTime() - startFuse) + ', results: ' + result.length);

				self.dataset = SearchService.limit(result, MAX_SEARCH_RESULTS);
			}
		} else if(self.type === 'Bloomfilter') {
			var startBloom = new Date().getTime();

			var result = [];

			if(self.webworkers) {
				self.bloomWorkerResults = [];
				BloomSearchService.resetWorkerCount();

				// init search via WebWorker
				BloomSearchService.search(term);
			} else {
				// perform search directly
				for(var i = 0; i < self.bloomDataset.length; i++) {
					if(self.bloomDataset[i].test(term)) {
						result.push(self.initialDataset[i]);
					}
				}
				console.log('Bloom search took ' + (new Date().getTime() - startBloom) + 'ms and found ' + result.length + ' results');

				self.dataset = SearchService.limit(result, MAX_SEARCH_RESULTS);
			}
		}
	};

	self.toggleLog = function() {
		self.logVisible = !self.logVisible;
	};

	// get all categories for UI
	self.categories = SearchService.categories;

	// get federals states for UI
	self.federalStates = SearchService.federalStates;

	// receive event from WebWorkers when they retrieved a result
	// TODO: Simplify!
	$scope.$on('BLOOM_FILTER_WORKERS_RESULT', function(event, workerData) {
		BloomSearchService.workerCount++;

		if(workerData.data.length > 0) {
			for(var i = 0; i < workerData.data.length; i++) {
				self.bloomWorkerResults.push(workerData.data[i]);
			}
		}
		
		if(BloomSearchService.workerCount >= 4) {
			// all workers will return their workerResults in an array so merge them
			var dataset = BloomSearchService.mergeBloomResults(self.bloomWorkerResults);
			console.log('All results received - Bloom WebWorker search took ' + (new Date().getTime() - this.startSearch) + 'ms and found ' + dataset.length + ' results');
			self.dataset = SearchService.limit(self.bloomWorkerResults, MAX_SEARCH_RESULTS);
		}

		// We need to call $scope.$apply here since WebWorker responses don't call a digest cycle
		$scope.$apply();
	});
	

	// Initialize controller
	self.init();

}]);