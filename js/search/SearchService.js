angular.module('search').factory('SearchService', function SearchService() {
	return {
		categories: {
			'lastName': true,
			'firstName': true,
			'street': true,
			'zipCode': true,
			'city': true,
			'stateName': true,
			'emailAddress': true,
			'phone': true,
			'dateOfBirthFormatted': true,
		},
		federalStates: {
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
		},
		pad: function(value, maxLength) {
		  	value = value + '';

			if (value.length >= maxLength) {
				return value;
			} else {
				return new Array(maxLength - value.length + 1).join('0') + value;
			}
		},
		limit: function(data, limit) {
			return data.slice(0, limit);
		},
		getFormattedDate: function(isoDate) {
			var date = new Date(isoDate);
			return this.pad(date.getDate(), 2) + '.' + this.pad((date.getMonth() + 1), 2) + '.' + date.getFullYear();
		}
	}
});