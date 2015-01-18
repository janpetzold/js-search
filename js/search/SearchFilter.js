angular.module('search').filter('match', ['DefaultAngularFilterService', function SearchFilter(DefaultAngularFilterService) {
	return function (items, expression, comparator) {
		var startFilter = new Date().getTime();

		var result = DefaultAngularFilterService.filterItems(items, expression, comparator);
		
		console.log('Filtering took ' + (new Date().getTime() - startFilter));

	    return result;
	};
}]);