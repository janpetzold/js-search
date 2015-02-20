angular.module('search').controller('SearchController', ['$scope', '$http', 'SearchService', 'LogService', 'AngularFilterService', 'FuseService', 'BloomSearchService', 
	function SearchController($scope, $http, SearchService, LogService, AngularFilterService, FuseService, BloomSearchService) {

	var MAX_SEARCH_RESULTS = 1000;

	var self = this;
	self.initialDataset = [];

	// Default search volume
	self.amount = 1000;

	// Default search type
	self.type = 'Angular';
	self.term = '';
	self.webworkers = false;

	// store results from BloomFilter in Controller since they get updated via event
	self.bloomWorkerResults = [];

	self.logVisible = true;
	self.log = LogService;

	/**
	 * Initialize the Controller.
	 * @param newDataAmount Optional parameter indicating that the amount of data to be searched was changed
	 */
	self.init = function(newDataAmount) {
		// load data once the user selected a different source dataset
		if(newDataAmount) {
			var jsonBench = LogService.startBenchmark('Fetch JSON data');
			$http.get('data/' + self.amount + '.json').success(function (data) {
				LogService.stopBenchmark(jsonBench);
				self.setDataset(data, true);
			});
		} else {
			self.setDataset(self.initialDataset, false);
		}
	};

	/**
	 * Set the dataset that builds the base for our search
	 *
	 * @param data The data (JSON)
	 * @param parse {boolean} dtermines whether the data needs to be parsed
	 */
	self.setDataset = function(data, parse) {
		// set correct federal states and format birthday
		if(parse) {
			var parseBench = LogService.startBenchmark('Parsing JSON data');
			data = SearchService.parseJson(data);
			LogService.stopBenchmark(parseBench);
		}

		// store initial dataset for later reference
		self.initialDataset = data;

		// Prepare Fuse data
		if(self.type === 'Fuse') {
			var fusePrepareBench = LogService.startBenchmark('Preparing Fuse data');
			self.fuseDataset = FuseService.initFuseDataset(self.initialDataset);
			LogService.stopBenchmark(fusePrepareBench);
		}

		// Prepare Bloom data
		if(self.type === 'Bloomfilter') {
			var bloomPrepareBench = LogService.startBenchmark('Preparing Bloomfilter data');
			self.bloomDataset = BloomSearchService.initBloomData(self.initialDataset);
			LogService.stopBenchmark(bloomPrepareBench);

			// if WebWorkers are enabled, split dataset in 4 parts since we say that we want four threads to run in parallel
			if (self.webworkers) {
				var bloomWebWorkerBench = LogService.startBenchmark('Initializing WebWorkers for Bloomfilter');
				BloomSearchService.initWorkerArray(self.initialDataset);
				LogService.stopBenchmark(bloomWebWorkerBench);
			}
		}

		// simply limit result set to 1000 - no pagination here and we don't want to run into rendering issues
		self.dataset = SearchService.limit(self.initialDataset, MAX_SEARCH_RESULTS);
	};

	self.changeAmount = function(newAmount) {
		self.amount = newAmount;
		self.reset();
		self.init(true);
	};

	self.changeType = function(newType) {
		self.type = newType;
		self.reset();
		self.init();
	};

	self.reset = function() {
		self.term = '';
	};

	self.search = function(term) {
		// Determine current type and search based on that choice
		if(self.type === 'Angular') {
			var angularSearch = LogService.startBenchmark('Search with Angular');
			var result = AngularFilterService.filterItems(self.initialDataset, term);
			LogService.stopBenchmark(angularSearch);

			self.dataset = SearchService.limit(result, MAX_SEARCH_RESULTS);
		} else if(self.type === 'Fuse') {
			if(self.term === '') {
				self.dataset = self.initialDataset;
			} else {
				var fuseSearch = LogService.startBenchmark('Search with fuse.js');
				var result = self.fuseDataset.search(term);
				LogService.stopBenchmark(fuseSearch);

				self.dataset = SearchService.limit(result, MAX_SEARCH_RESULTS);
			}
		} else if(self.type === 'Bloomfilter') {
			var result = [];

			if(self.webworkers) {
				self.bloomWorkerResults = [];
				BloomSearchService.resetWorkerCount();

				// init search via WebWorker
				self.bloomWebWorkerSearch = LogService.startBenchmark('Search with Bloomfilter (WebWorker)');
				BloomSearchService.search(term);
			} else {
				// perform search directly
				var bloomSingleSearch = LogService.startBenchmark('Search with Bloomfilter (single thread)');
				for(var i = 0; i < self.bloomDataset.length; i++) {
					if(self.bloomDataset[i].test(term)) {
						result.push(self.initialDataset[i]);
					}
				}
				LogService.stopBenchmark(bloomSingleSearch);

				self.dataset = SearchService.limit(result, MAX_SEARCH_RESULTS);
			}
		}
	};

	self.toggleLog = function() {
		self.logVisible = !self.logVisible;
	};

	self.clearLog = function() {
		LogService.messages = '';
	};

	// receive event from WebWorkers when they retrieved a result - handled here since we display it in the UI
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
			LogService.stopBenchmark(self.bloomWebWorkerSearch);

			self.dataset = SearchService.limit(self.bloomWorkerResults, MAX_SEARCH_RESULTS);
		}

		// We need to call $scope.$apply here since WebWorker responses don't call a digest cycle
		$scope.$apply();
	});
	

	// Initialize controller
	self.init(true);

}]);