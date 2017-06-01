/// <reference path="../lib/angular.min.js" />
"use strict";
function fold(arr, bufer) {
    for (var i = 0; i < arr.length; i++) {
        if (Array.isArray(arr[i])) {
            fold(arr[i], bufer);
        } else {
            bufer.push(arr[i]);
        }
    }

    return bufer;
}
var ang = angular.module('app', ['ngRoute']);
ang
    .controller("mainA", function ($scope, su, $http) {

        $scope.savemodal = function () {
            $("#savemodal").modal('show');
        }
        $scope.saveData = function () {
            var model = $scope.getmodel();
            su.Save(model);
        }
        $scope.upload = function () {
            var files = $("#inputUpload")[0].files;
            if (!files || files.length === 0) {
                alert("выберите файл перед загрузкой!");
            } else {
                su.upload(files);
                $("#savemodal").modal('toggle');
                $(".menu-btn")[0].click();
            }
        }
        $(document).on('change', ':file', function () {
            var input = $(this),
                numFiles = input.get(0).files ? input.get(0).files.length : 1,
                label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
            input.trigger('fileselect', [numFiles, label]);
        });
        $(document).ready(function () {
            $(':file').on('fileselect', function (event, numFiles, label) {

                var input = $(this).parents('.input-group').find(':text'),
                    log = numFiles > 1 ? numFiles + ' files selected' : label;

                if (input.length) {
                    input.val(log);
                } else {
                    if (log) alert(log);
                }

            });
        });
    })
    .service("su", function ($http, $compile, $route) {
        this.loadCompl = true;
        this.data = null;
        this.rerender = function () {
            //var content = angular.element('#content');
            //var scope = content.scope();
            //$compile(content.contents())(scope);
            $route.reload();
        }
        this.Save = function (storageObj) {
            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storageObj, function (key, value) {
                if (key === "$$hashKey") {
                    return undefined;
                }

                return value;
            }));
            var dlAnchorElem = document.getElementById('downloadAnchorElem');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", "scene.json");
            dlAnchorElem.click();
            dlAnchorElem.removeAttribute("href");
            dlAnchorElem.removeAttribute("download");
        }
        this.upload = function (files) {
            this.loadCompl = false;
            if (files.length > 0) {
                if (window.FormData !== undefined) {
                    //var data = new FormData();
                    //for (var x = 0; x < files.length; x++) {
                    //    data.append("file" + x, files[x]);
                    //}
                    //$http.post('/Index/Upload', data).then(
                    //   function (r) {
                    //    this.loadCompl = true;
                    //    $(document).trigger('loadComplete', r.data)
                    //}, function (xhr, status, p3) {
                    //    this.loadCompl = true;
                    //    alert(xhr.responseText);
                    //});
                    //var file = files[0];
                    //file.name = "file";
                    //$.ajax({
                    //    type: "POST",
                    //    url: '/Index/Upload',
                    //    contentType: false,
                    //    processData: false,
                    //    data: data,
                    //    success: function (r) {
                    //        this.loadCompl = true;
                    //        $(document).trigger('loadComplete', r.data)
                    //    },
                    //    error: function (xhr, status, p3) {
                    //        this.loadCompl = true;
                    //        alert(xhr.responseText);
                    //    }
                    //});

                    var reader = new FileReader();
                    reader.onload = (function (files) {
                        return function (e) {
                            $(document).trigger('loadComplete', JSON.parse(e.target.result))
                        };
                    })(files[0]);
                    reader.readAsText(files[0]);
                } else {
                    alert("Браузер не поддерживает загрузку файлов HTML5!");
                }
            }
        }
    })
    .controller('main',
        function ($scope, su) {

            $scope.getmodel = function () {
                return {
                    countStates: $scope.countStates,
                    countStrategis: $scope.countStrategis,
                    countModeling: $scope.countModeling,
                    buttonStartHidden: $scope.buttonStartHidden,
                    evaluateComplete: $scope.evaluateComplete,
                    namesStates: $scope.namesStates,
                    namesCapital: $scope.namesCapital,
                    inputMatrix: $scope.inputMatrix,
                    inputMatrixD: $scope.inputMatrixD,
                    outputMatrix: $scope.outputMatrix,
                    cy: $scope.cy
                }
            }

            $scope.setmodel = function (d) {
                $scope.countStates = d.countStates;
                $scope.countStrategis = d.countStrategis;
                $scope.countModeling = d.countModeling;

                $scope.buttonStartHidden = d.buttonStartHidden;
                $scope.evaluateComplete = d.evaluateComplete;
                $scope.namesStates = d.namesStates;
                $scope.namesCapital = d.namesCapital;
                $scope.inputMatrix = d.inputMatrix;
                $scope.inputMatrixD = d.inputMatrixD;
                $scope.outputMatrix = d.outputMatrix;
                $scope.cy = d.cy;
            }

            $scope.countStates = 2;
            $scope.countStrategis = 3;
            $scope.countModeling = 10;

            function hiddenButton(n, old) {
                //if (n !== old)
                    //$scope.buttonStartHidden = false;
            };

            $(document).on('loadComplete', function (event, data) {
                cleanUp();
                su.rerender();

                $scope.setmodel(data);
                $scope.startEvaluate();
                //su.rerender();
            })

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


            $scope.startEvaluate = function () {
                $scope.evaluateComplete = true;
                var process = new MarkovProcess($scope.inputMatrix, $scope.inputMatrixD, $scope.countStates);
                $scope.outputMatrix = process.makeTable();

                $scope.favoriteStrategys = process.modeling($scope.countModeling);

                var nodes = [];
                var template = $scope.namesStates.concat($scope.namesStates);
                for (var j = 0; j < template.length; j++) {
                    nodes.push({
                        label: template[j].name,
                        id: j
                    });
                }


                var edges = fold($scope.outputMatrix.map(function (item) {
                    return item.variants.map(function (varint) {
                        return {
                            from: item.state,
                            to: item.variants.indexOf(varint) === item.state
                                ? item.state + $scope.namesStates.length
                                : item.variants.indexOf(varint),
                            label: (item.strategy + 1),
                            color: item.strategy === $scope.favoriteStrategys[item.state] ? 'red' : '#A5D6A7',
                            arrows: 'to'
                        };
                    });
                }), []);

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
            };

            $scope.example = function () {
                cleanUp();
                for (var l = 0; l < $scope.countStates; l++) {
                    $scope.namesStates.push({ name: "p" + l });
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

            $scope.generateTablesForInput = function () {
                if ($scope.countStates <= 0 || $scope.countStrategis <= 0 || $scope.countModeling <= 0) {
                    alert('Заполните все поля!');
                    return;
                }
                if ($scope.countStates > 10 || $scope.countStrategis >= 10 || $scope.countModeling >= 20) {
                    alert('Недопустимые значения в полях ввода (смотри описание ошибок в руководстве пользователя)');
                    return;
                }
                cleanUp();


                for (var l = 0; l < $scope.countStates; l++) {
                    $scope.namesStates.push({ name: "p" + l });
                    $scope.namesCapital.push("r" + l);
                }

                var generator = function () {
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

            $scope.example();
            $scope.startEvaluate();
        })
    .controller('LVM',
        function ($scope, su) {
            $scope.typeShape = "state";
            $scope.var = 0;
            $scope.label = '';
            $scope.callBack = null;
            var network = null;
            var data = [];

            $scope.getmodel = function () {
                return {
                    edges: objectToArray(network.body.data.edges._data),
                    nodes: objectToArray(network.body.data.nodes._data)
                };
            }


            $(document).on('loadComplete',
                function(event, _data) {
                    clear();
                    data = _data;
                    init();

                });

            function clear() {
                $scope.typeShape = "state";
                $scope.var = 0;
                $scope.label = '';
                $scope.callBack = null;
                $scope.data = null;
            }

            $scope.update = function () {
                var data = $scope.data;

                $scope.label = data.label;
                $scope.var = Number(data.title.split(":")[1] ? data.title.split(":")[1] : 0);
                //$scope.callBack
                $scope.typeShape = (function () {
                    switch (data.class) {
                        case "prv":
                            return 'state';
                        case "mainv":
                            return 'state';
                        case 'or':
                            return data.class;
                        case 'and':
                            return data.class;
                    };

                    return null;
                })(data);

                su.rerender();
            };

            $scope.showModal = function (data, callback) {
                $scope.data = data;
                $scope.callBack = callback;
                $("#myModal").modal('show');
            };

            $("#myModal").on('hidden.bs.modal', function () {
                $scope.callBack(null);
                clear();
            });


            $("#myModal").on('shown.bs.modal', function () {
                $scope.update();
            });

            $scope.createEdge = function (data, callback) {
                var from = network.body.data.nodes._data[data.from],
                    to = network.body.data.nodes._data[data.to];

                if (from.class === 'mainv') {
                    alert("Конечные вершины, они оранжевые, не должны иметь выходных дуг");
                    callback(null);
                    return;
                } else if (from.class === 'prv' && to.class === 'mainv') {
                    alert("Должна присутствовать логическая вершина между " + from.label + " и  " + to.label);
                    callback(null);
                    return;
                } else if (from.class === to.class) {
                    alert("Нельзя соединять однотипные вершины");
                    callback(null);
                    return;
                } else {
                    callback(data);
                }
            }

            function addToLabel(obj, text) {
                if (obj.indexOf(':') !== -1) {
                    var temp = obj.split(':');
                    return temp[0] + ": " + text;
                } else {
                    return obj + " : " + text;
                }
            }

            function getVAl(mainNode, nodes, edges) {
                if (!mainNode || !nodes || !edges) {
                    console.log("exeption in getVal: bullshit in arguments");
                    return;
                }

                if (mainNode.class === 'mainv') {
                    return Number(mainNode.title.split(':')[1]);
                } else if (mainNode.class === 'prv') {
                    var logicNode = nodes.get(edges.get({
                        filter: function (item) {
                            return item.from === mainNode.id;
                        }
                    })[0].to);

                    var p = 1;
                    var childNodes = edges
                            .get({
                                filter: function (item) {
                                    return item.from === logicNode.id;
                                }
                            })
                            .map(function (mapItem) {
                                return nodes.get(mapItem.to);
                            });

                    if (logicNode.class === 'and') {
                        for (var i = 0; i < childNodes.length; i++) {
                            p *= getVAl(childNodes[i], nodes, edges);
                        }
                        nodes._data[mainNode.id].label = addToLabel(nodes._data[mainNode.id].label, math.round(p, 5));
                        return p;
                    } else {
                        for (var j = 0; j < childNodes.length; j++) {
                            p *= 1 - getVAl(childNodes[j], nodes, edges);
                        }

                        p = 1 - p;
                        nodes._data[mainNode.id].label = addToLabel(nodes._data[mainNode.id].label, math.round(p, 5));

                        return p;
                    }
                }
            }
            $scope.Save = function () {
                var data = $scope.data;
                switch ($scope.typeShape) {
                    case "state":
                        data = angular.merge({}, data, {
                            label: $scope.var > 0 ? $scope.data.label + " : " + $scope.var : $scope.data.label,
                            title: $scope.var > 0 ? "Вероятность возникновения : " + $scope.var : "Промежуточная вершина",
                            shape: 'box',
                            font: {
                                size: 24
                            },
                            size: 50,
                            color: {
                                background: $scope.var > 0 ? '#F57C00' : '#4CAF50',
                                border: $scope.var > 0 ? '#F57C00' : '#81C784'
                            },
                            class: $scope.var > 0 ? 'mainv' : 'prv'
                        });
                        break;
                    case "or":
                        data = angular.merge({}, data, {
                            label: 'ИЛИ',
                            title: 'Логическое ИЛИ',
                            shape: 'cicle',
                            size: 80,
                            color: {
                                background: '#0288D1',
                                border: '#00B0FF'
                            },
                            font: {
                                size: 24,
                                bold: true
                            },
                            class: 'or'
                        });
                        break;
                    case "and":
                        data = angular.merge({}, data, {
                            label: 'И',
                            title: 'логическое И',
                            shape: 'cicle',
                            size: 80,
                            color: {
                                background: '#D81B60',
                                border: '#FF80AB'
                            },
                            font: {
                                size: 24,
                                bold: true
                            },
                            class: 'and'
                        });
                        break;
                }

                $scope.callBack(data);
                $("#myModal").modal('hide');
            };

            $scope.startEvaluate = function () {
                var nodes = network.body.data.nodes,
                    edges = network.body.data.edges;

                var tmp = nodes
                    .get({
                        filter: function (item) {
                            return item.class === 'prv';
                        }
                    })
                    .filter(function (item) {
                        return edges.get({
                            filter: function (edge) {
                                return edge.to === item.id;
                            }
                        }).length === 0;
                    })[0];

                getVAl(tmp, nodes, edges);
                data = {
                    nodes: nodes,
                    edges: edges
                }

                draw();
            };
            $scope.example = function () {
                data = {
                    edges: JSON.parse('[{ "from": "4ab940c3-e219-40f2-aafb-888c24b56fd3", "to": "0a2f9737-bfba-448d-be07-6e7829d31cc2", "id": "4450ccb2-34ab-48fc-ac10-a99940ea548a" }, { "from": "4ab940c3-e219-40f2-aafb-888c24b56fd3", "to": "3c97d13a-e796-4307-aa06-701c54318a9a", "id": "35c6466a-257c-4e19-9ec1-240228ccc3d7" }, { "from": "ca12a46c-5be3-4d5e-a942-dc3f37ecddfc", "to": "4ab940c3-e219-40f2-aafb-888c24b56fd3", "id": "45cb0f41-e2ff-4ff2-adeb-1eae17706970" }, { "from": "b69820e3-1894-4255-ae89-cd2c02e18482", "to": "74503a2d-985b-4dae-b982-da7f51be25d1", "id": "9d218838-2b1d-439e-ad5e-bd3d48cbefd2" }, { "from": "b69820e3-1894-4255-ae89-cd2c02e18482", "to": "ebe17d26-f907-4be9-aefa-3197427dce91", "id": "42d1c06e-7339-4fea-9b63-0543a5ce48a8" }, { "from": "ce98f1c9-f82e-423e-9742-f6109fa2b3b8", "to": "b69820e3-1894-4255-ae89-cd2c02e18482", "id": "caec8897-269c-43f4-8f51-e3692e747c0d" }, { "from": "3a663519-1b1a-4797-80fd-0fdfad6a24e5", "to": "c781d28d-de5c-4634-9727-dc325b72e571", "id": "d06cb9ec-1208-461d-b0c1-00affb0ae260" }, { "from": "3a663519-1b1a-4797-80fd-0fdfad6a24e5", "to": "7b49454d-c59e-4b1f-a4d5-ee1e8521d182", "id": "3aa07209-f308-462a-b650-af1abbf98ad6" }, { "from": "ebe17d26-f907-4be9-aefa-3197427dce91", "to": "3a663519-1b1a-4797-80fd-0fdfad6a24e5", "id": "944dfc9d-cbf0-4c05-9f78-a2561a39cb02" }, { "from": "65af04ab-89bf-4eed-b410-dd8ae08e786d", "to": "ce04289e-2d5f-45d1-8c41-ccc037ec0df9", "id": "6a013ae2-0753-4ca0-9a26-da5683e91d78" }, { "from": "65af04ab-89bf-4eed-b410-dd8ae08e786d", "to": "38a40eec-0114-4871-8500-ddc809592049", "id": "d8195121-3005-43ab-bc1c-9a18f157ca8b" }, { "from": "3c97d13a-e796-4307-aa06-701c54318a9a", "to": "65af04ab-89bf-4eed-b410-dd8ae08e786d", "id": "60ddd231-9e73-4a79-8fd5-981edb831f74" }, { "from": "cec6714a-d2ac-4e10-8def-04b4fb5db6fb", "to": "c9db01f0-138f-46e1-803e-13fee2df7e53", "id": "c26bce5d-3b4d-4907-ad9a-2fb83f02e1f8" }, { "from": "c9db01f0-138f-46e1-803e-13fee2df7e53", "to": "ca12a46c-5be3-4d5e-a942-dc3f37ecddfc", "id": "492458a3-e873-4440-9b75-468292144aa2" }, { "from": "c9db01f0-138f-46e1-803e-13fee2df7e53", "to": "ce98f1c9-f82e-423e-9742-f6109fa2b3b8", "id": "d44b0732-d3ea-49b0-8eab-c23670d2b065" }, { "from": "c9db01f0-138f-46e1-803e-13fee2df7e53", "to": "ca7adcf9-d2c8-4c2d-a360-6e6224eda476", "id": "83fb774e-a540-40d9-abc1-7a8666636550" }]'),
                    nodes: JSON.parse('[{"id":"cec6714a-d2ac-4e10-8def-04b4fb5db6fb","x":-87.5,"y":-231,"label":"Отказ информационной системы","title":"Промежуточная вершина","shape":"box","size":50,"color":{"background":"#4CAF50","border":"#81C784"},"class":"prv"},{"id":"ca12a46c-5be3-4d5e-a942-dc3f37ecddfc","x":-290.5,"y":-63,"label":"Отказ датацентра","title":"Промежуточная вершина","shape":"box","size":50,"color":{"background":"#4CAF50","border":"#81C784"},"class":"prv"},{"id":"ce98f1c9-f82e-423e-9742-f6109fa2b3b8","x":221.5,"y":0,"label":"Перебои в электропитании","title":"Промежуточная вершина","shape":"box","size":50,"color":{"background":"#4CAF50","border":"#81C784"},"class":"prv"},{"id":"ca7adcf9-d2c8-4c2d-a360-6e6224eda476","x":420.0807550573094,"y":-150,"label":"Выход из строя сетевого оборудования : 0.002","title":"Вероятность возникновения : 0.002","shape":"box","size":50,"color":{"highlight":{},"hover":{},"border":"#F57C00","background":"#F57C00"},"class":"mainv","fixed":{"y":true,"x":false},"font":{"bold":{},"boldital":{},"ital":{},"mono":{}},"icon":{},"margin":{},"scaling":{"label":{}},"shadow":{},"shapeProperties":{}},{"id":"3c97d13a-e796-4307-aa06-701c54318a9a","x":438.5,"y":33,"label":"Потеря связи с датацентром","title":"Промежуточная вершина","shape":"box","size":50,"color":{"background":"#4CAF50","border":"#81C784"},"class":"prv"},{"id":"0a2f9737-bfba-448d-be07-6e7829d31cc2","x":-92.839473057706,"y":0,"label":"Выход из строя сетевого оборудования : 0.001","title":"Вероятность возникновения : 0.001","shape":"box","size":50,"color":{"highlight":{},"hover":{},"border":"#F57C00","background":"#F57C00"},"class":"mainv","fixed":{"y":true,"x":false},"font":{"bold":{},"boldital":{},"ital":{},"mono":{}},"icon":{},"margin":{},"scaling":{"label":{}},"shadow":{},"shapeProperties":{}},{"id":"4ab940c3-e219-40f2-aafb-888c24b56fd3","x":-152.5,"y":-149,"label":"ИЛИ","title":"Логическое ИЛИ","shape":"cicle","size":50,"color":{"background":"#0288D1","border":"#00B0FF"},"class":"or"},{"id":"b69820e3-1894-4255-ae89-cd2c02e18482","x":209.2706000000001,"y":147.5753,"label":"ИЛИ","title":"Логическое ИЛИ","shape":"cicle","size":50,"color":{"background":"#0288D1","border":"#00B0FF"},"class":"or"},{"id":"74503a2d-985b-4dae-b982-da7f51be25d1","x":126.52556978101643,"y":150,"label":"Обрыв линии электропередач : 0.03","title":"Вероятность возникновения : 0.03","shape":"box","size":50,"color":{"highlight":{},"hover":{},"border":"#F57C00","background":"#F57C00"},"class":"mainv","fixed":{"y":true},"font":{"bold":{},"boldital":{},"ital":{},"mono":{}},"icon":{},"margin":{},"scaling":{"label":{}},"shadow":{},"shapeProperties":{}},{"id":"ebe17d26-f907-4be9-aefa-3197427dce91","x":733.4184000000002,"y":-148.17290000000008,"label":"Обрыв линии электропередач","title":"Промежуточная вершина","shape":"box","size":50,"color":{"background":"#4CAF50","border":"#81C784"},"class":"prv"},{"id":"7b49454d-c59e-4b1f-a4d5-ee1e8521d182","x":36.50680000000004,"y":334.98010000000005,"label":"Ураган : 0.0005","title":"Вероятность возникновения : 0.0005","shape":"box","size":50,"color":{"background":"#F57C00","border":"#F57C00"},"class":"mainv"},{"id":"c781d28d-de5c-4634-9727-dc325b72e571","x":300.0448000000001,"y":-12.011600000000055,"label":"Типичная халатность : 0.001","title":"Вероятность возникновения : 0.001","shape":"box","size":50,"color":{"background":"#F57C00","border":"#F57C00"},"class":"mainv"},{"id":"3a663519-1b1a-4797-80fd-0fdfad6a24e5","x":630.9314000000002,"y":-19.332100000000057,"label":"ИЛИ","title":"Логическое ИЛИ","shape":"cicle","size":50,"color":{"background":"#0288D1","border":"#00B0FF"},"class":"or"},{"id":"65af04ab-89bf-4eed-b410-dd8ae08e786d","x":-547.6691000000001,"y":213.4598,"label":"И","title":"логическое И","shape":"cicle","size":50,"color":{"background":"#D81B60","border":"#FF80AB"},"class":"and"},{"id":"ce04289e-2d5f-45d1-8c41-ccc037ec0df9","x":702.6723000000002,"y":-274.08550000000014,"label":"Скачок напряжения : 0.001","title":"Вероятность возникновения : 0.001","shape":"box","size":50,"color":{"background":"#F57C00","border":"#F57C00"},"class":"mainv"},{"id":"38a40eec-0114-4871-8500-ddc809592049","x":816.8721000000003,"y":-307.75980000000015,"label":"Выход из строя сетевого оборудования : 0.001","title":"Вероятность возникновения : 0.001","shape":"box","size":50,"color":{"background":"#F57C00","border":"#F57C00"},"class":"mainv"},{"id":"c9db01f0-138f-46e1-803e-13fee2df7e53","x":-51.33919999999998,"y":-320.93670000000014,"label":"ИЛИ","title":"Логическое ИЛИ","shape":"cicle","size":50,"color":{"background":"#0288D1","border":"#00B0FF"},"class":"or"}]')
                };
                init();
            }

            function destroy() {
                if (network !== null) {
                    network.destroy();
                    network = null;
                }
            }

            function draw() {
                destroy();
                // create a network
                var container = document.getElementById('vis');
                var options = {
                    layout: {
                        hierarchical: {
                            sortMethod: "directed",
                            nodeSpacing: 400
                        }
                    },
                    edges: {
                        smooth: true,
                        arrows: { to: true }
                    },
                    locale: 'ru',
                    manipulation: {
                        addNode: function (data, callback) {
                            $scope.showModal(data, callback);
                        },
                        editNode: function (data, callback) {
                            $scope.showModal(data, callback);
                        },
                        addEdge: function (data, callback) {
                            console.log(data);

                            if (data.from == data.to) {
                                alert("Нельзя замыкать вершины на себе");
                            }
                            else {
                                $scope.createEdge(data, callback);
                            }
                        }
                    },
                    physics: {
                        enabled: false,
                        barnesHut: {
                            gravitationalConstant: -200,
                            centralGravity: 0,
                            springLength: 1000,
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
                    }
                };
                network = new vis.Network(container, data, options);
                console.log(network);
            }

            function cancelEdit(callback) {
                callback(null);
            }

            function init() {
                $('#vis').height($(window).height() - 80);
                draw();
            }

            window.onload = init;

            function objectToArray(obj) {
                return Object.keys(obj).map(function (key) { return obj[key]; });
            }

        });