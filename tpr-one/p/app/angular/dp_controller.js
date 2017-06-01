(function() {
    "use strict"
    var app = angular.module("app", ['ngRoute']);
    app
        .controller("mainA",
            function($scope, su, $http) {

                $scope.savemodal = function() {
                    $("#savemodal").modal('show');
                }
                $scope.saveData = function() {
                    var model = $scope.getmodel();
                    su.Save(model);
                }
                $scope.upload = function() {
                    var files = $("#inputUpload")[0].files;
                    if (!files || files.length === 0) {
                        alert("выберите файл перед загрузкой!");
                    } else {
                        su.upload(files);
                        $("#savemodal").modal('toggle');
                        $(".menu-btn")[0].click();
                    }
                }
                $(document).on('change',
                    ':file',
                    function() {
                        var input = $(this),
                            numFiles = input.get(0).files ? input.get(0).files.length : 1,
                            label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
                        input.trigger('fileselect', [numFiles, label]);
                    });
                $(document).ready(function() {
                    $(':file').on('fileselect',
                        function(event, numFiles, label) {

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
        .service("su",
            function($http, $compile, $route) {
                this.loadCompl = true;
                this.data = null;
                this.rerender = function() {
                    $route.reload();
                }
                this.Save = function(storageObj) {
                    var dataStr = "data:text/json;charset=utf-8," +
                        encodeURIComponent(JSON.stringify(storageObj,
                            function(key, value) {
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
                this.upload = function(files) {
                    this.loadCompl = false;
                    if (files.length > 0) {
                        if (window.FormData !== undefined) {
                            var reader = new FileReader();
                            reader.onload = (function(files) {
                                return function(e) {
                                    $(document).trigger('loadComplete', JSON.parse(e.target.result))
                                };
                            })(files[0]);
                            reader.readAsText(files[0]);
                        } else {
                            alert("Браузер не поддерживает загрузку файлов HTML5!");
                        }
                    }
                }
            });

    app.controller('DPcontroller',
        function($scope, su) {
            $scope.typeShape = "state";
            $scope.var = 0;
            $scope.label = '';
            $scope.callBack = null;
            var network = null;
            var data = [];

            $scope.getmodel = function() {
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

            $scope.update = function() {
                var data = $scope.data;

                $scope.label = data.label;
                $scope.var = data.dataNode.cost;
                //$scope.callBack
                $scope.typeShape = data.dataNode.class;

                su.rerender();
            };

            $scope.showModal = function(data, callback) {
                $scope.data = data;
                $scope.callBack = callback;
                $("#myModal").modal('show');
            };

            $("#myModal").on('hidden.bs.modal',
                function() {
                    $scope.callBack(null);
                    clear();
                });


            $("#myModal").on('shown.bs.modal',
                function() {
                    $scope.update();
                });

            $scope.createEdge = function(data, callback) {
                var from = network.body.data.nodes._data[data.from],
                    to = network.body.data.nodes._data[data.to];
                var x = prompt("Введите значение вероятности", "0.5");

                while (isNaN(x)) {
                    alert("Не число");
                    x = prompt("Введите значение вероятности", x);
                }

                data.label = x;

                if (from === to) {
                    alert("Нельзя создавать петли");
                    callback(null);
                    return;
                }

                callback(data);
            }

            function getVAl(mainNode, edgeVer, nodes, edges) {
                if (!mainNode || !nodes || !edges) {
                    console.log("exeption in getVal: bullshit in arguments");
                    return;
                }

                if (mainNode.dataNode.class === 'CompleteState') {
                    return Number(mainNode.dataNode.cost) * edgeVer;
                } else if (mainNode.dataNode.class === 'BetweenState') {
                    var edgesFromMain = edges.get({ filter: function(item) { return item.from === mainNode.id } });
                    var sum = 0;
                    edgesFromMain.forEach(function (item,index) {
                        var toNode = nodes.get({ filter: function(i) { return i.id === item.to } })[0];
                        sum += getVAl(toNode, Number(item.label), nodes, edges);
                    });
                    nodes._data[mainNode.id].label = 'M\n' + sum;
                    return sum * edgeVer;

                } else if (mainNode.dataNode.class === 'StartState') {
                    var edgesFromMain = edges.get({ filter: function(item) { return item.from === mainNode.id } });
                    var temp = [];
                    edgesFromMain.forEach(function (item,index) {
                        var toNode = nodes.get({ filter: function(i) { return i.id === item.to } })[0];
                        temp.push(getVAl(toNode, Number(item.label), nodes, edges));
                    });
                    var max = Array.max(temp);
                    nodes._data[mainNode.id].label = max;
                    return edgesFromMain[temp.indexOf(max)];
                }
            }

            $scope.Save = function() {
                var data = $scope.data;
                switch ($scope.typeShape) {
                case "BetweenState":
                    data = angular.merge({},
                        data,
                        {
                            label: 'M',
                            title: "Промежуточная вершина",
                            shape: 'circle',
                            font: {
                                size: 24
                            },
                            size: 250,
                            color: {
                                background: '#D81B60',
                                border: '#FF80AB'
                            },
                            dataNode: {
                                class: 'BetweenState',
                                label: $scope.label || 'Конечная вершина',
                                cost: $scope.var || 0
                            }
                        });
                    break;
                case "StartState":
                    data = angular.merge({},
                        data,
                        {
                            label: '---',
                            title: 'Корневая вершина',
                            shape: 'box',
                            size: 400,
                            color: {
                                background: '#0288D1',
                                border: '#00B0FF'
                            },
                            font: {
                                size: 24,
                                bold: true
                            },
                            dataNode: {
                                class: 'StartState',
                                label: $scope.label || 'Корневая вершина',
                                cost: $scope.var || 0
                            }
                        });
                    break;
                case "CompleteState":
                    data = angular.merge({},
                        data,
                        {
                            label: $scope.var + '\n' + $scope.label,
                            title: 'Конечная вершина',
                            shape: 'box',
                            size: 200,
                            color: {
                                background: '#F57C00',
                                border: '#F57C00'
                            },
                            font: {
                                size: 24,
                                bold: true
                            },
                            dataNode: {
                                class: 'CompleteState',
                                label: $scope.label || 'Конечная вершина',
                                cost: $scope.var || 0
                            }
                        });
                    break;
                }

                $scope.callBack(data);
                $("#myModal").modal('hide');
            };

            $scope.startEvaluate = function() {
                var nodes = network.body.data.nodes,
                    edges = network.body.data.edges;

                var tmp = nodes
                    .get({
                        filter: function(item) {
                            return item.dataNode.class === 'StartState';
                        }
                    })[0];

                var edge = getVAl(tmp, 0, nodes, edges);

                

                edgesApplyColor(edge, '#F44336', nodes, edges);
                
                data = {
                    nodes: nodes,
                    edges: edges
                }

                draw();
            };

            function edgesApplyColor(edge, color, nodes, edges) {
                edges._data[edge.id].color = {
                    color:  color,
                    highlight: color,
                    hover: color
                };

                var efn = edges.get({ filter: function (ed) { return nodes.get({ filter: function (item) { return item.id === edge.to } })[0].id === ed.from } });

                if (efn.length === 0)
                    return;

                efn.forEach(function(item) {
                    edgesApplyColor(item, color, nodes, edges);
                });

            }

            $scope.example = function() {
                data = {
                    edges: JSON.parse('[{"from":"8e2ae82a-5418-49d8-8ee8-71db71aa9807","to":"4e989ca9-1c6d-4e8b-ad78-39cc68e9ba0b","label":"0.5","id":"abb67e19-5623-402c-a535-bd093b7c9187"},{"from":"8e2ae82a-5418-49d8-8ee8-71db71aa9807","to":"14e3a89e-faed-4d07-b505-30621431b225","label":"0.5","id":"38012c79-ec71-41d9-ba3a-58b64b67dbfa"},{"from":"14e3a89e-faed-4d07-b505-30621431b225","to":"4ea240b8-fc95-4b81-bc85-d751c586db4d","label":"0.25","id":"81bda301-3e51-4b4e-8298-7d8d3d3956cd"},{"from":"14e3a89e-faed-4d07-b505-30621431b225","to":"21cee727-99b6-46f2-b0c3-acc5a4c3b756","label":"0.25","id":"a1998eaa-e1ab-403f-9bda-aebefe6a49f1"},{"from":"4e989ca9-1c6d-4e8b-ad78-39cc68e9ba0b","to":"f247e262-4c8d-4a03-b562-f96f6a978c39","label":"0.5","id":"a37fee90-b8f8-4252-ac82-41ceac324940"},{"from":"4e989ca9-1c6d-4e8b-ad78-39cc68e9ba0b","to":"cd87eb12-2296-43f8-bc94-05df325d8672","label":"0.5","id":"89cf3c5d-81a7-432c-810e-6c646c64902f"},{"from":"14e3a89e-faed-4d07-b505-30621431b225","to":"3bfb4b92-7de8-4997-beb1-e414e9e7055e","label":"0.25","id":"3da44a9e-82c6-434f-8a63-4d68229faf51"},{"from":"14e3a89e-faed-4d07-b505-30621431b225","to":"792281a6-90a4-400f-a0e5-56b62e59b6ec","label":"0.25","id":"8635a555-43c1-4043-acaa-2a1aafee147f"}]'),

                    nodes: JSON.parse('[{"id":"8e2ae82a-5418-49d8-8ee8-71db71aa9807","x":-200,"y":-200,"label":"---","title":"Корневая вершина","shape":"box","size":400,"color":{"highlight":{},"hover":{},"border":"#00B0FF","background":"#0288D1"},"font":{"bold":true,"boldital":{},"ital":{},"mono":{},"size":24,"vadjust":0},"dataNode":{"class":"StartState","label":"---","cost":0},"fixed":{"x":true},"icon":{},"margin":{},"scaling":{"label":{}},"shadow":{},"shapeProperties":{}},{"id":"4e989ca9-1c6d-4e8b-ad78-39cc68e9ba0b","x":0,"y":-800,"label":"M","title":"Промежуточная вершина","shape":"circle","font":{"bold":{},"boldital":{},"ital":{},"mono":{},"size":24,"vadjust":0},"size":250,"color":{"highlight":{},"hover":{},"border":"#FF80AB","background":"#D81B60"},"dataNode":{"class":"BetweenState","label":"M","cost":0},"fixed":{"x":true},"icon":{},"margin":{},"scaling":{"label":{}},"shadow":{},"shapeProperties":{}},{"id":"14e3a89e-faed-4d07-b505-30621431b225","x":0,"y":400,"label":"M","title":"Промежуточная вершина","shape":"circle","font":{"bold":{},"boldital":{},"ital":{},"mono":{},"size":24,"vadjust":0},"size":250,"color":{"highlight":{},"hover":{},"border":"#FF80AB","background":"#D81B60"},"dataNode":{"class":"BetweenState","label":"M","cost":0},"fixed":{"x":true},"icon":{},"margin":{},"scaling":{"label":{}},"shadow":{},"shapeProperties":{}},{"id":"4ea240b8-fc95-4b81-bc85-d751c586db4d","x":0,"y":200,"label":"200new","title":"Конечная вершина","shape":"box","size":200,"color":{"highlight":{},"hover":{},"border":"#F57C00","background":"#F57C00"},"font":{"bold":true,"boldital":{},"ital":{},"mono":{},"size":24,"vadjust":0},"dataNode":{"class":"CompleteState","label":"0new","cost":200},"fixed":{"x":true},"icon":{},"margin":{},"scaling":{"label":{}},"shadow":{},"shapeProperties":{}},{"id":"21cee727-99b6-46f2-b0c3-acc5a4c3b756","x":161.5,"y":-7,"label":"-100 new","title":"Конечная вершина","shape":"box","size":200,"color":{"background":"#F57C00","border":"#F57C00"},"font":{"size":24,"bold":true},"dataNode":{"class":"CompleteState","label":"new","cost":-100}},{"id":"f247e262-4c8d-4a03-b562-f96f6a978c39","x":-196.93110100000015,"y":21.70466800000003,"label":"400new","title":"Конечная вершина","shape":"box","size":200,"color":{"background":"#F57C00","border":"#F57C00"},"font":{"size":24,"bold":true},"dataNode":{"class":"CompleteState","label":"new","cost":400}},{"id":"cd87eb12-2296-43f8-bc94-05df325d8672","x":-81.77963600000014,"y":-240.48636000000002,"label":"-400new","title":"Конечная вершина","shape":"box","size":200,"color":{"background":"#F57C00","border":"#F57C00"},"font":{"size":24,"bold":true},"dataNode":{"class":"CompleteState","label":"new","cost":-400}},{"id":"3bfb4b92-7de8-4997-beb1-e414e9e7055e","x":-430.19869205099957,"y":-227.49469829500003,"label":"3new","title":"Конечная вершина","shape":"box","size":200,"color":{"background":"#F57C00","border":"#F57C00"},"font":{"size":24,"bold":true},"dataNode":{"class":"CompleteState","label":"new","cost":3}},{"id":"792281a6-90a4-400f-a0e5-56b62e59b6ec","x":248.71426545750023,"y":205.118345678,"label":"-10new","title":"Конечная вершина","shape":"box","size":200,"color":{"background":"#F57C00","border":"#F57C00"},"font":{"size":24,"bold":true},"dataNode":{"class":"CompleteState","label":"new","cost":-10}}]')
                } 
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
                            nodeSpacing: 400,
                            direction: 'LR',
                            levelSeparation: 200
                        }
                    },
                    edges: {
                        smooth: true,
                        arrows: { to: true }
                    },
                    locale: 'ru',
                    manipulation: {
                        addNode: function(data, callback) {
                            $scope.showModal(data, callback);
                        },
                        editNode: function(data, callback) {
                            $scope.showModal(data, callback);
                        },
                        addEdge: function(data, callback) {
                            console.log(data);

                            if (data.from == data.to) {
                                alert("Нельзя замыкать вершины на себе");
                            } else {
                                $scope.createEdge(data, callback);
                            }
                        },
                        editEdge: {
                            editWithoutDrag: function(data, callback) {
                                if (typeof data.to === 'object')
                                    data.to = data.to.id;
                                if (typeof data.from === 'object')
                                    data.from = data.from.id;
                                var x = prompt("Введите значение вероятности", "0.5");

                                while (isNaN(x)) {
                                    alert("Не число");
                                    x = prompt("Введите значение вероятности", x);
                                }

                                data.label = x;
                                callback(data);
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
                return Object.keys(obj).map(function(key) { return obj[key]; });
            }

        });
})(angular, window);


Array.max = function (array) {
    return Math.max.apply(Math, array);
};

Array.min = function (array) {
    return Math.min.apply(Math, array);
};
