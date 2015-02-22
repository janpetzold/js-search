angular.module('search').factory('LogService', function LogService() {
	return {
		messages: '',
		startBenchmark: function(name) {
			return {
				'name': name,
				'start': new Date().getTime()
			};
		},
		stopBenchmark: function(benchmark) {
			var stop = new Date().getTime() - benchmark.start;
			console.log('Operation ' + benchmark.name + ' took ' + stop + 'ms.');
			this.addMessage('Operation <strong>' + benchmark.name + '</strong> took <strong>' + stop + 'ms</strong><br/>');
		},
		addMessage: function(msg) {
			this.messages = this.messages + msg;

			// TODO: Put this in a directive. However we're just prototyping here...
			var logWindow = document.getElementById("js-search-log");
			logWindow.scrollTop = logWindow.scrollHeight;
		}
	};
});