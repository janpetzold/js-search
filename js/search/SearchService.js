angular.module('search').factory('SearchService', ['LogService', function SearchService(LogService) {
	return {
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
		parseJson: function(data) {
			var dataLength = data.length;
			var parsedData = [];
			for (var i = 0; i < dataLength; i++) {
				var item = {};
				// use clear identifiers for the data here
				item.id = data[i].id;
				item.lastName = data[i].ln;
				item.firstName = data[i].fn;
				item.street = data[i].st;
				item.houseNumber = data[i].hn;
				item.zip = data[i].zi;
				item.city = data[i].ci;
				item.stateName = this.federalStates[data[i].sa];
				item.email = data[i].ma;
				item.phone = data[i].ph;
				item.dateOfBirthFormatted = this.getFormattedDate(data[i].bi);

				parsedData.push(item);

				if(i != 0 && i % 50000 == 0) {
					//LogService.addMessage('50000 datasets parsed and counting...<br />');
				}
			}
			return parsedData;
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
}]);