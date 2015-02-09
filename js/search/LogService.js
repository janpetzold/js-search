angular.module('search').factory('LogService', function LogService() {
	return {
		messages: '',
		startBenchmark: function(name) {
			return {
				'name': name,
				'start': new Date().getTime()
			}
		},
		stopBenchmark: function(benchmark) {
			var stop = new Date().getTime() - benchmark.start;
			console.log('Benchmark ' + benchmark.name + ' finished in ' + stop + 'ms.');
			this.messages = this.messages + 'Benchmark ' + benchmark.name + ' finished in ' + stop + 'ms.\r\n';
		}
	}
});