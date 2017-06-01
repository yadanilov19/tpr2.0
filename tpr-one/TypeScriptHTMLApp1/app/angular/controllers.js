/// <reference path="../lib/angular.min.js" />
"use strict";
var angular = angular.module('app', []);
var controller = angular
    .controller('main',
        function($scope) {
            $scope.countStates = 2;
            $scope.countStrategis = 3;
            $scope.countModeling = 10;

            function hiddenButton(n, old) {
                if (n !== old)
                    $scope.buttonStartHidden = false;
            };

            $scope.$watch('countStates', hiddenButton);
            $scope.$watch('countStrategis', hiddenButton);
            $scope.$watch('countModeling', hiddenButton);

            function cleanUp() {
                $scope.buttonStartHidden = false;
                $scope.evaluateComplete = false;
                $scope.namesStates = [];
                $scope.namesCapital = [];
                $scope.inputMatrix = [];
                $scope.inputMatrixD = [];
                $scope.outputMatrix = [];
                $scope.cy = null;
            };

            $scope.startEvaluate = function() {
                var process = new MarkovProcess($scope.inputMatrix, $scope.inputMatrixD, $scope.countStates);
                $scope.outputMatrix = process.makeTable();

                $scope.favoriteStrategys = process.modeling($scope.countModeling);

                var nodes = [];
                var template = $scope.namesStates.concat($scope.namesStates);
                for (var j = 0; j < template.length; j++) {
                    nodes.push({
                        label: template[j],
                        id: j
                    });
                }

                function fold(arr, bufer = []) {
                    for (var i = 0; i < arr.length; i++) {
                        if (Array.isArray(arr[i])) {
                            fold(arr[i], bufer);
                        } else {
                            bufer.push(arr[i]);
                        }
                    }

                    return bufer;
                }

                    var edges = fold($scope.outputMatrix.map((item) => (item.variants.map((varint) => ({
                        from: item.state,
                        to: item.variants.indexOf(varint) === item.state ? item.state + $scope.namesStates.length : item.variants.indexOf(varint),
                        label: (item.strategy + 1),
                        color: item.strategy === $scope.favoriteStrategys[item.state] ? 'red' : '#A5D6A7',
                        arrows:'to'
                    })))));

                    // create a network
                    var container = document.getElementById('gagagagagaga');

                    // provide the data in the vis format
                    var data = {
                        nodes: nodes,
                        edges: edges
                    };

                    var options = {
                        layout: {
                            randomSeed: 100,
                            improvedLayout: true,
                            hierarchical: {
                                enabled: false
                            }
                        },
                        physics: {
                            enabled: true,
                            barnesHut: {
                                gravitationalConstant: -200,
                                centralGravity: 0,
                                springLength: 95,
                                springConstant: 0.001,
                                damping: 0.09,
                                avoidOverlap: 0
                            },
                            maxVelocity: 50,
                            minVelocity: 0.1,
                            solver: 'barnesHut',
                            stabilization: {
                                enabled: true,
                                iterations: 1000,
                                updateInterval: 100,
                                onlyDynamicEdges: false,
                                fit: true
                            }
                        },
                        interaction: {
                            multiselect: false,
                            navigationButtons: true,
                            selectable: false,
                            selectConnectedEdges: false,
                            tooltipDelay: 300,
                            zoomView: false
                        }
                    };

                    // initialize your network!
                    var network = new vis.Network(container, data, options);
                    //makeGraph();
                    $scope.evaluateComplete = true;
                };

                $scope.example = function() {
                    cleanUp();
                    for (var l = 0; l < $scope.countStates; l++) {
                        $scope.namesStates.push("p" + l);
                        $scope.namesCapital.push("r" + l);
                    }

                    $scope.buttonStartHidden = true;

                    $scope.inputMatrix = [
                        [[{ "value": 0.3 }, { "value": 0.7 }], [{ "value": 0.2 }, { "value": 0.8 }]],
                        [[{ "value": 1 }, { "value": 0 }], [{ "value": 1 }, { "value": 0 }]],
                        [[{ "value": 0.2 }, { "value": 0.8 }], [{ "value": 0.1 }, { "value": 0.9 }]]
                    ];
                    $scope.inputMatrixD = [
                        [[{ "value": 2332 }, { "value": 32023 }], [{ "value": 2032 }, { "value": 3 }]],
                        [[{ "value": 2 }, { "value": 3 }], [{ "value": 5 }, { "value": 65 }]],
                        [[{ "value": 65 }, { "value": 465 }], [{ "value": 4 }, { "value": 654 }]]
                    ];
                };

                $scope.generateTablesForInput = function() {
                    if ($scope.countStates <= 0 || $scope.countStrategis <= 0 || $scope.countModeling <= 0) {
                        alert('Заполните все поля!');
                        return;
                    }
                    cleanUp();

                    //$scope.inputMatrix = [[[{ "value": 0.3 }, { "value": 0.7 }], [{ "value": 0.2 }, { "value": 0.8 }]], [[{ "value": 1 }, { "value": 0 }], [{ "value": 1 }, { "value": 0 }]], [[{ "value": 0.2 }, { "value": 0.8 }], [{ "value": 0.1 }, { "value": 0.9 }]]];
                    //$scope.inputMatrixD = [[[{ "value": 2332 }, { "value": 32023 }], [{ "value": 2032 }, { "value": 3 }]], [[{ "value": 2 }, { "value": 3 }], [{ "value": 5 }, { "value": 65 }]], [[{ "value": 65 }, { "value": 465 }], [{ "value": 4 }, { "value": 654 }]]];

                    for (var l = 0; l < $scope.countStates; l++) {
                        $scope.namesStates.push("p" + l);
                        $scope.namesCapital.push("r" + l);
                    }

                    var generator = function() {
                        var tmpInputmatrix = [];
                        for (var i = 0; i < $scope.countStrategis; i++) {
                            var tmp = [];
                            for (var j = 0; j < $scope.countStates; j++) {
                                var rowtmp = [];
                                for (var k = 0; k < $scope.countStates; k++) {
                                    rowtmp.push({
                                        value: 0
                                    });
                                }
                                tmp.push(rowtmp);
                            }
                            tmpInputmatrix.push(tmp);
                        }
                        return tmpInputmatrix;
                    }

                    $scope.inputMatrix = generator();
                    $scope.inputMatrixD = generator();

                    $scope.buttonStartHidden = true;
                };
            })