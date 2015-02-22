angular.module('search').factory('FuseService', function FuseService() {
	return {
		// default fuse options
		fuseOptions: {
	  		caseSensitive: false,
	  		includeScore: false,
	  		shouldSort: true,
	  		threshold: 0.4,
	  		location: 0,
	  		distance: 100,
	  		maxPatternLength: 20,
	  		keys: ['lastName', 'firstName', 'street', 'houseNumber', 'zip', 'city', 'stateName', 'email', 'phone', 'dateOfBirthFormatted']
		},
		initFuseDataset: function(dataset) {
			return new Fuse(dataset, this.fuseOptions);
		}
	};
});