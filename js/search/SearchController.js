angular.module('search').controller('SearchController', ['$scope', '$http', 'DefaultAngularFilterService', 'BloomSearchService', function SearchController($scope, $http, DefaultAngularFilterService, BloomSearchService) {
	var MAX_SEARCH_RESULTS = 1000;

	var self = this;

	self.initialDataset = [];

	// Default search volume
	self.amount = 1000;

	// Default search type
	self.type = 'Bloomfilter';
	self.term = '';
	self.webworkers = true;

	// Four WebWorkers by default
	self.worker1;
	self.worker2;
	self.worker3;
	self.worker4;

	self.init = function() {
		var startData = new Date().getTime();

		// load data
		$http.get('data/' + self.amount + '.json').success(function(data) {
			console.log('Data fetched in ' + (new Date().getTime() - startData));

			// set correct federal states and format birthday
			var startFormatting = new Date().getTime();
			for(var i = 0; i < data.length; i++) {
				data[i].stateName = self.federalStates[data[i].state];
				data[i].dateOfBirthFormatted = self.getFormattedDate(data[i].dateOfBirth);
			}

			// keep intial dataset for later reference
			if(self.initialDataset.length == 0) {
				self.initialDataset = data;
			}

			console.log('Data formatted in ' + (new Date().getTime() - startFormatting));

			self.dataset = self.limit(data, MAX_SEARCH_RESULTS);

			// Prepare Fuse data
			var startFuse = new Date().getTime();
			self.fuseDataset = new Fuse(self.initialDataset, self.fuseOptions);
			console.log('Fuse data prepared in ' + (new Date().getTime() - startFuse));

			// Prepare Bloom data
			var startBloom = new Date().getTime();

			self.bloomDataset = [];

			for(var i = 0; i < self.initialDataset.length; i++) {
				var bloom = new BloomFilter(32 * 256, 6);

				bloom.add(self.initialDataset[i].lastName);
				bloom.add(self.initialDataset[i].firstName);
				bloom.add(self.initialDataset[i].street);
				bloom.add(self.initialDataset[i].zipCode);
				bloom.add(self.initialDataset[i].city);
				bloom.add(self.initialDataset[i].stateName);
				bloom.add(self.initialDataset[i].emailAddress);
				bloom.add(self.initialDataset[i].phone);
				bloom.add(self.initialDataset[i].dateOfBirthFormatted);

				self.bloomDataset.push(bloom);
			}

			// if WebWorkers are enabled, split dataset in 4 parts since we say that we want foru threads to run in parallel
			if(self.webworkers) {
				var startWebWorker = new Date().getTime();

				// Initialize the WebWorker
				self.worker1 = new Worker('js/search/BloomSearchWorker.js');
				self.worker2 = new Worker('js/search/BloomSearchWorker.js');
				self.worker3 = new Worker('js/search/BloomSearchWorker.js');
				self.worker4 = new Worker('js/search/BloomSearchWorker.js');

				// add event listener to WebWorkers
				BloomSearchService.addEventListenersForWorkers(
					[self.worker1, self.worker2, self.worker3, self.worker4], 
					self.bloom.webworker.handleResult, 
					self.bloom.webworker.handleError);

				console.log('Ramp-up WebWorkers took ' + (new Date().getTime() - startWebWorker) + 'ms');

				// serialize dataset
				var startSerializing = new Date().getTime();
				var serializedBloomDataset = BloomSearchService.serializeBloomData(self.bloomDataset);
				console.log('Serializing data took ' + (new Date().getTime() - startSerializing) + 'ms');

				//slice dataset for the workers so each one gets one fourth of the original dataset
				var slicedDataset = BloomSearchService.sliceData(self.initialDataset, serializedBloomDataset);

				var startMessaging = new Date().getTime();
				
				self.worker1.postMessage(BloomSearchService.getWebWorkerInitMessage(0, slicedDataset));
				self.worker2.postMessage(BloomSearchService.getWebWorkerInitMessage(1, slicedDataset));
				self.worker3.postMessage(BloomSearchService.getWebWorkerInitMessage(2, slicedDataset));
				self.worker4.postMessage(BloomSearchService.getWebWorkerInitMessage(3, slicedDataset));

				console.log('Messaging to WebWorkers took ' + (new Date().getTime() - startMessaging) + 'ms');
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
			var result = DefaultAngularFilterService.filterItems(self.initialDataset, term);

			console.log('Angular search took ' + (new Date().getTime() - startAngular) + ', results: ' + result.length);

			self.dataset = self.limit(result, MAX_SEARCH_RESULTS);
		} else if(self.type === 'Fuse') {
			if(self.term === '') {
				self.dataset = self.initialDataset;
			} else {
				var startFuse = new Date().getTime();
				var result = self.fuseDataset.search(term);	

				console.log('Fuse search took ' + (new Date().getTime() - startFuse) + ', results: ' + result.length);

				self.dataset = self.limit(result, MAX_SEARCH_RESULTS);
			}
		} else if(self.type === 'Bloomfilter') {
			var startBloom = new Date().getTime();

			var result = [];

			if(self.webworkers) {
				self.bloom.webworker.resetWorkerCount();

				// search via WebWorker
				self.worker1.postMessage({
					'type': 'search',
					'term': term
				});
				self.worker2.postMessage({
					'type': 'search',
					'term': term
				});
				self.worker3.postMessage({
					'type': 'search',
					'term': term
				});
				self.worker4.postMessage({
					'type': 'search',
					'term': term
				});
			} else {
				// perform search directly
				for(var i = 0; i < self.bloomDataset.length; i++) {
					if(self.bloomDataset[i].test(term)) {
						result.push(self.initialDataset[i]);
					}
				}
				console.log('Bloom search took ' + (new Date().getTime() - startBloom) + 'ms and found ' + result.length + ' results');

				self.dataset = self.limit(result, MAX_SEARCH_RESULTS);
			}
		}
	}

	// TODO: Put following stuff in service


	// Bloom-related methods for workers
	self.bloom = {
		webworker: {
			workerCount: 0,
			workerResults: []
		}
	};

	self.bloom.webworker.resetWorkerCount = function() {
		self.bloom.webworker.workerCount = 0;
		self.bloom.webworker.workerResults = [];
		self.bloom.webworker.startSearch = new Date().getTime();
	};

	self.bloom.webworker.handleResult = function(workerResult) {			
		self.bloom.webworker.workerCount++;

		if(workerResult.data.length > 0) {
			self.bloom.webworker.workerResults.push(workerResult.data);
		}
		
		if(self.bloom.webworker.workerCount >= 4) {
			// all workers will return their workerResults in an array so merge them
			var dataset = BloomSearchService.mergeBloomResults(self.bloom.webworker.workerResults);
			self.dataset = self.limit(dataset, MAX_SEARCH_RESULTS);

			console.log('All results received - Bloom WebWorker search took ' + (new Date().getTime() - self.bloom.webworker.startSearch) + 'ms and found ' + dataset.length + ' results');

			// We need to call $scope.$apply here since WebWorker responses don't call a digest cycle
			$scope.$apply();
		}
	};

	self.bloom.webworker.handleError = function() {
		console.log('Error retrieved');
	};

	// generic methods
	self.limit = function(data, limit) {
		return data.slice(0, limit);
	};

	// Generic fuse options for search
	self.fuseOptions = {
  		caseSensitive: false,
  		includeScore: false,
  		shouldSort: true,
  		threshold: 0.4,
  		location: 0,
  		distance: 100,
  		maxPatternLength: 20,
  		keys: ['lastName', 'firstName', 'street', 'zipCode', 'city', 'stateName', 'emailAddress', 'phone', 'dateOfBirthFormatted']
	};

	self.categories = {
		'lastName': true,
		'firstName': true,
		'street': true,
		'zipCode': true,
		'city': true,
		'stateName': true,
		'emailAddress': true,
		'phone': true,
		'dateOfBirthFormatted': true,
	}

	self.federalStates = {
		'BW': 'Baden-Württemberg',
		'BY': 'Bayern', 
		'BE': 'Berlin', 
		'BB': 'Brandenburg', 
		'HB': 'Bremen', 
		'HH': 'Hamburg', 
		'HE': 'Hessen',
		'MV': 'Mecklenburg-Vorpommern', 
		'NI': 'Niedersachsen', 
		'NW': 'Nordrhein-Westfalen', 
		'RP': 'Rheinland-Pfalz', 
		'SL': 'Saarland', 
		'SN': 'Sachsen', 
		'ST': 'Sachsen-Anhalt', 
		'SH': 'Schleswig-Holstein', 
		'TH': 'Thüringen'
	};

	self.pad = function(value, maxLength) {
	  	value = value + '';

		if (value.length >= maxLength) {
			return value;
		} else {
			return new Array(maxLength - value.length + 1).join('0') + value;
		}
	};

	self.getFormattedDate = function(isoDate) {
		var date = new Date(isoDate);
		return self.pad(date.getDate(), 2) + '.' + self.pad((date.getMonth() + 1), 2) + '.' + date.getFullYear();
	};

	// Initialize controller
	self.init();

}]);