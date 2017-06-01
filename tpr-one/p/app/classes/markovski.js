var MarkovProcess = (function () {
    function MarkovProcess(data, dataD, states) {
        this.numModelingIteration = 0;
        this.data = [];
        this.dataD = [];
        this.mainMatrix = [];
        this.output = {};
        this.graph = {};
        this.table = [];
        this.states = states;
        this.data = data;
        this.dataD = dataD;
        this.mainMatrix = Matrix.decartMul(this.data, this.dataD);
    }
    MarkovProcess.prototype.makeTable = function () {
        var table = [];
        for (var i = 0; i < this.states; i++) {
            table = table.concat(Matrix.getNthElement(this.mainMatrix, i));
        }
        this.table = table;
        return table;
    };
    MarkovProcess.prototype.modeling = function (numModeling) {
        var _this = this;
        this.v = [];
        for (var l = 0; l < this.states; l++) {
            this.v.push(Array.apply(null, Array(this.mainMatrix.length)).map(Number.prototype.valueOf, 0));
        }
        for (var i = 0; i < numModeling; i++) {
            for (var j = 0; j < this.states; j++) {
                for (var k = 0; k < this.mainMatrix.length; k++) {
                    var number = this.mainMatrix[k].sum[j] + this.mainMatrix[k].varianty[j].map(function (item) { return (item.value * _this.v[j][k]); })
                        .reduce(function (a, b) { return (a + b); });
                    this.v[j][k] = this.v[j][j] > number ? this.v[j][k] : number;
                }
            }
        }
        var graduate = Matrix.getMaxOfArray(this.v);
        return graduate;
    };
    return MarkovProcess;
}());
var Matrix = (function () {
    function Matrix() {
    }
    Matrix.decartMul = function (a, b) {
        var tmp = [];
        for (var i = 0; i < a.length; i++) {
            tmp.push({
                varianty: a[i],
                deposit: b[i]
            });
        }
        Matrix.sum(tmp);
        return tmp;
    };
    Matrix.sum = function (a) {
        for (var i = 0; i < a.length; i++) {
            a[i].sum = [];
            a[i].varianty
                .forEach(function (value, index) {
                a[i].sum.push(Matrix.mulSum(value, a[i].deposit[index]));
            });
        }
    };
    Matrix.mulSum = function (a, b) {
        var tmp = 0;
        for (var i = 0; i < a.length; i++) {
            tmp += a[i].value * b[i].value;
        }
        return tmp;
    };
    Matrix.getNthElement = function (mainMatrix, number) {
        var rowsState = [];
        for (var i = 0; i < mainMatrix.length; i++) {
            rowsState.push({
                isState: i === 0,
                state: number,
                strategy: i,
                variants: mainMatrix[i].varianty[number],
                deposit: mainMatrix[i].deposit[number],
                sum: mainMatrix[i].sum[number]
            });
        }
        return rowsState;
    };
    Matrix.getMaxOfArray = function (numArray) {
        var maxArray = [];
        for (var i = 0; i < numArray.length; i++) {
            maxArray.push(numArray[i].indexOf(Math.max.apply(null, numArray[i])));
        }
        return maxArray;
    };
    return Matrix;
}());
//# sourceMappingURL=markovski.js.map