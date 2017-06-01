class MarkovProcess {
    private states;
    private numModelingIteration = 0;
    data = [];
    dataD = [];
    mainMatrix = [];
    output = {};
    graph = {};
    table = [];

    constructor(data, dataD, states) {
        this.states = states;
        this.data = data;
        this.dataD = dataD;

        this.mainMatrix = Matrix.decartMul(this.data, this.dataD);
    }

    public makeTable() {
        let table = [];
        for (var i = 0; i < this.states; i++) {
            table = table.concat(Matrix.getNthElement(this.mainMatrix, i));
        }
        this.table = table;
        return table;
    }

    

    private v: Array<number>;
    public modeling(numModeling: number) {
        this.v = [];
        for (var l = 0; l < this.states; l++) {
            this.v.push(Array.apply(null, Array(this.mainMatrix.length)).map(Number.prototype.valueOf, 0));
        }
        
        for (var i = 0; i < numModeling; i++) {
            for (var j = 0; j < this.states; j++) {
                for (var k = 0; k < this.mainMatrix.length; k++) {
                    let number = this.mainMatrix[k].sum[j] + this.mainMatrix[k].varianty[j].map(item => (item.value * this.v[j][k]))
                        .reduce((a, b) => (a + b));
                    this.v[j][k] = this.v[j][j] > number ? this.v[j][k] : number;
                }
            }
        }
        let graduate = Matrix.getMaxOfArray(this.v);
        return graduate;
    }
}

class Matrix {
    static decartMul(a, b) {
        var tmp = [];
        for (var i = 0; i < a.length; i++) {
            tmp.push({
                varianty: a[i],
                deposit: b[i]
            });
        }
        Matrix.sum(tmp);
        return tmp;
    }

    static sum(a) {
        for (var i = 0; i < a.length; i++) {
            a[i].sum = [];
            a[i].varianty
                .forEach(function (value, index) {
                    a[i].sum.push(Matrix.mulSum(value, a[i].deposit[index]));
                });
        }
    }

    static mulSum(a, b) {
        var tmp = 0;
        for (var i = 0; i < a.length; i++) {
            tmp += a[i].value * b[i].value;
        }
        return tmp;
    }

    static getNthElement(mainMatrix: any[], number: number) {
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
    }

    static getMaxOfArray(numArray) {
        var maxArray = [];
        for (var i = 0; i < numArray.length; i++) {
            maxArray.push(numArray[i].indexOf(Math.max.apply(null, numArray[i])));
        }
        return maxArray;
    }
}