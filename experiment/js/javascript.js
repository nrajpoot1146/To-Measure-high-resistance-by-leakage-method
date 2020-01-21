var preCon = null;
//update the x and y coordinate
var update = function (x, y) {
    var tempX = document.getElementById("mouseX");
    var tempY = document.getElementById("mouseY");
    tempX.innerHTML = x;
    tempY.innerHTML = y;
};

var Terminal = function () {
    this.obj = document.getElementById("terminal");
    this.obj.innerHTML = ">>";
    this.update = function (str) {
        this.value = this.obj.innerHTML;
        this.value += str + "<br>>>";
        this.obj.innerHTML = this.value;
        this.obj.scrollTo(0, this.obj.scrollHeight);
    }
    this.reset = function () {
        this.obj.innerHTML = "";
    }
}

var getMousePos = function (canvas, e) {
    var boundingClientRect = canvas.getBoundingClientRect();
    var tx = e.clientX - boundingClientRect.left;
    var ty = e.clientY - boundingClientRect.top;
    return {
        x: tx < 0 ? 0 : tx,
        y: ty < 0 ? 0 : ty
    };
};

var pointType = {
    PASSIVE: 0x00,
    ACTIVE: 0x01,
    ACTIVE_PASSIVE: 0x02
};

var operationType = {
    DRAW_POINT: 0X00,
    DRAW_TWO_WAY_KEY: 0X01,
    DRAW_RESISTOR: 0X02,
    DRAW_CELL: 0X03,
    DRAW_GALVANOMETER: 0X04,
    DRAW_POTENTIOMETER: 0X05,
    DRAW_CONDENSER: 0X06,
    DRAW_TAPKEY: 0x07,

    MAKE_CONNECTION: 0X13,
    START_SIMULATION: 0X14,
    STOP_SIMULATION: 0X15,

    RESET: 0X21,
    UNDO: 0X22,
    REDO: 0X23
};

var level = {
    LOW: false,
    HIGH: true
};

var conMap = {
    Z: ["GA", "CA", "RA", "BA", "K3A"],
    RA: ["Z"],
    CA: ["Z"],
    GA: ["Z", "K3A"],
    BA: ["Z"],
    K3A: ["GA", "Z"],
    GB: ["K3I", "K1A"],
    K3I: ["GB", "K1A", "K3A", "K3"],
    K1A: ["GB", "K3I","K1I"],
    K1I: ["CB", "K2I", "K1B","K1A"],
    K2I: ["CB", "K1I", "K2A", "K2"],
    CB: ["K1I", "K2I"],
    K2A: ["RB"],
    RB: ["K2A"],
    K1B: ["BB","K1I"],
    BB: ["K1B"]
}

var point = function (canvasId, imageId, x, y, r, type, name, element) {
    this.name = name;
    this.connection = [];
    this.V = 0;
    this.type = type;
    this.level = level.LOW;
    this.image = imageId;
    this.point = { x: x, y: y, r: r };
    this.device = element;
    this.draw = function () {
        if (this.image == null) {
            canvas.context.beginPath();
            canvas.context.arc(this.point.x, this.point.y, this.point.r, 0, 2 * Math.PI);
            canvas.context.lineWidth = "5";
            canvas.context.strokeStyle = "black";
            canvas.context.stroke();
            canvas.context.closePath();

            canvas.context.font = "12px Arial";
            canvas.context.fillStyle = "black";
            canvas.context.fillText(name, this.point.x - 10, this.point.y - 12);

            canvas.context.font = "12px Arial";
            //canvas.context.fillText(this.V, this.point.x - 10, this.point.y + 22);
        }
    };
    this.isInside = function (x, y) {
        var d = Math.pow(x - this.point.x, 2) + Math.pow(y - this.point.y, 2)
        d = Math.sqrt(d);
        if (d <= parseFloat(this.point.r)) {
            return true;
        }
        return false;
    };
    this.update = function () {
        if (this.type == pointType.ACTIVE) {

        } else {

        }
    }
};

var Wire = function (a, b, tilt) {
    this.a = a;
    this.b = b;

    this.current = 0;
    this.tilt = tilt;
    this.color = null;

    this.draw = function () {
        var flag = conMap[this.a.device == null ? this.a.name : this.a.device.name + this.a.name].includes(this.b.device == null ? this.b.name : this.b.device.name + this.b.name);
        if (flag)
            this.color = "green";
        else {
            this.color = "red";
            terminal.update("wrong connection");
        }

        canvas.context.beginPath();
        canvas.context.strokeStyle = this.color;
        //canvas.context.fill("grey");
        canvas.context.lineWidth = 5;
        canvas.context.moveTo(this.a.point.x, this.a.point.y);
        if (this.tilt) {
            canvas.context.lineTo(this.a.point.x, this.b.point.y);
            canvas.context.lineTo(this.b.point.x, this.b.point.y);
        } else {
            canvas.context.lineTo(this.b.point.x, this.b.point.y);
        }
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.beginPath();
        canvas.context.arc(this.a.point.x, this.a.point.y, 3, 0, 2 * Math.PI);
        canvas.context.strokeStyle = this.color;
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.beginPath();
        canvas.context.arc(this.b.point.x, this.b.point.y, 3, 0, 2 * Math.PI);
        canvas.context.strokeStyle = this.color;
        canvas.context.stroke();
        canvas.context.closePath();
    }

    this.operate = function () {
        if (this.a.type == pointType.ACTIVE && this.b.type != pointType.ACTIVE) {
            this.b.V = this.a.V;
        } else if (this.b.type == pointType.ACTIVE && this.a.type != pointType.ACTIVE) {
            this.a.V = this.b.V;
        } else if (this.a.type == this.b.type) {
            if (this.a.V > this.b.V) {
                this.a.V = this.a.V;
            } else {
                this.b.V = this.a.V;
            }
        }
    }
};

var TwoWayKey = function (x, y, name) {
    this.width = 50;
    this.height = 50;
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.input = new point(canvas.id, null, this.x + 10, this.y + 25, 4, pointType.PASSIVE, "I", this);
    this.outputA = new point(canvas.id, null, this.x + 40, this.y + 10, 4, pointType.PASSIVE, "A", this);
    this.outputB = new point(canvas.id, null, this.x + 40, this.y + 40, 4, pointType.PASSIVE, "B", this);
    this.output = this.outputA;
    this.Wire = null;
    this.name = name;
    this.draw = function () {
        // canvas.context.beginPath();
        // canvas.context.rect(this.x, this.y, this.width, this.height);
        // canvas.context.lineWidth = "1";
        // canvas.context.stroke();
        // canvas.context.closePath();

        canvas.context.font = "12px Arial";
        canvas.context.fillStyle = "black";
        canvas.context.fillText(name, this.x + this.width / 2 - 4, this.y + this.height / 2 + 30);

        this.Wire = new Wire(this.input, this.output, false);
        this.Wire.draw();

        this.input.draw();
        this.outputA.draw();
        this.outputB.draw();

        // canvas.context.beginPath();
        // canvas.context.rect(this.x, this.y, this.width, this.height);
        // canvas.context.stroke();
        // canvas.context.closePath();
    };

    this.isInside = function (x, y) {
        if (x > this.x && y > this.y && x < this.x + this.width && y < this.y + this.height) {
            return true;
        }
        return false;
    };

    this.click = function () {
        if (this.output == this.outputA) {
            this.output = this.outputB;
        } else
            this.output = this.outputA;
        if (this.input.V >= this.output.V) {
            this.output.V = this.input.V;
        } else {
            this.input.V = this.output.V;
        }
        canvas.draw();
    };
};

var TapKey = function (x, y, name) {
    this.width = 50;
    this.height = 50;
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.input = new point(canvas.id, null, this.x + 40, this.y + 25, 4, pointType.PASSIVE, "I", this);
    this.outputB = new point(canvas.id, null, this.x + 10, this.y + 10, 0, pointType.PASSIVE, "", this);
    this.outputA = new point(canvas.id, null, this.x + 10, this.y + 40, 4, pointType.PASSIVE, "A", this);
    this.output = this.outputB;
    this.Wire = null;
    this.name = name;
    this.isOn = false;
    this.draw = function () {
        // canvas.context.beginPath();
        // canvas.context.rect(this.x, this.y, this.width, this.height);
        // canvas.context.lineWidth = "1";
        // canvas.context.stroke();
        // canvas.context.closePath();

        this.Wire = new Wire(this.input, this.output, false);
        this.Wire.draw();

        canvas.context.font = "12px Arial";
        canvas.context.fillStyle = "black";
        canvas.context.fillText(name, this.x + this.width / 2 - 4, this.y + this.height / 2 + 30);

        this.input.draw();
        this.outputA.draw();
        this.outputB.draw();

        // canvas.context.beginPath();
        // canvas.context.rect(this.x, this.y, this.width, this.height);
        // canvas.context.stroke();
        // canvas.context.closePath();
    };

    this.isInside = function (x, y) {
        if (x > this.x && y > this.y && x < this.x + this.width && y < this.y + this.height) {
            return true;
        }
        return false;
    };

    this.click = function () {
        if (this.output == this.outputA) {
            this.output = this.outputB;
            this.isOn = false;
        } else {
            this.output = this.outputA;
            this.isOn = true;
        }
        if (this.input.V > this.output.V) {
            this.output.V = this.input.V;
        } else {
            this.input.V = this.output.V;
        }
        canvas.draw();
    };
};

var Cell = function (x, y, name) {
    this.width = 80;
    this.height = 30;
    this.V = 12;
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.A = new point(canvas.id, null, this.x + 3, this.y + this.height / 2, 5, pointType.ACTIVE, "A", this);
    this.B = new point(canvas.id, null, this.x - 3 + this.width, this.y + this.height / 2, 5, pointType.ACTIVE, "B", this);
    this.A.V = 12;
    this.B.V = 0;
    this.name = name;
    this.draw = function () {
        // canvas.context.beginPath();
        // canvas.context.rect(this.x, this.y, this.width, this.height);
        // canvas.context.lineWidth = "1";
        // canvas.context.stroke();
        // canvas.context.closePath();

        canvas.context.lineWidth = "2";
        canvas.context.strokeStyle = "black";

        canvas.context.beginPath();
        canvas.context.moveTo(this.x + 4, this.y + this.height / 2);
        canvas.context.lineTo(this.x + 25, this.y + this.height / 2);
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.beginPath();
        canvas.context.moveTo(this.x + 25, this.y);
        canvas.context.lineTo(this.x + 25, this.y + this.height);
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.beginPath();
        canvas.context.moveTo(this.x + 35, this.y + 7);
        canvas.context.lineTo(this.x + 35, this.y + this.height - 7);
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.beginPath();
        canvas.context.moveTo(this.x + 45, this.y);
        canvas.context.lineTo(this.x + 45, this.y + this.height);
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.beginPath();
        canvas.context.moveTo(this.x + 55, this.y + 7);
        canvas.context.lineTo(this.x + 55, this.y + this.height - 7);
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.beginPath();
        canvas.context.moveTo(this.x + 55, this.y + this.height / 2);
        canvas.context.lineTo(this.x + this.width - 4, this.y + this.height / 2);
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.font = "12px Arial";
        canvas.context.fillStyle = "black";
        canvas.context.fillText(name, this.x + this.width / 2 - 4, this.y + this.height / 2 + 30);

        this.A.draw();
        this.B.draw();
    };
    this.isInside = function () {

    }
};

var Resistor = function (x, y, name) {
    this.width = 60;
    this.height = 10;
    this.x = x - (this.width - 20) / 2;
    this.y = y - this.height / 2;

    this.R = 0;
    this.name = name;
    this.A = new point(canvas.id, null, this.x - 20, this.y + this.height / 2, 4, pointType.PASSIVE, "A", this);
    this.B = new point(canvas.id, null, this.x + 60, this.y + this.height / 2, 4, pointType.PASSIVE, "B", this);

    this.draw = function () {
        canvas.context.beginPath();
        canvas.context.rect(this.x, this.y, this.width - 20, this.height);
        canvas.context.lineWidth = "1";
        canvas.context.strokeStyle = "black";
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.beginPath();
        canvas.context.moveTo(this.x + 40, this.y + this.height / 2);
        canvas.context.lineTo(this.x + 60, this.y + this.height / 2);
        canvas.context.lineWidth = 2;
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.beginPath();
        canvas.context.moveTo(this.x, this.y + this.height / 2);
        canvas.context.lineTo(this.x - 20, this.y + this.height / 2);
        canvas.context.lineWidth = "2";
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.font = "12px Arial";
        canvas.context.fillStyle = "black";
        canvas.context.fillText(name, this.x + this.width / 2 - 4, this.y + this.height / 2 + 30);

        this.A.draw();
        this.B.draw();
    }
    this.isInside = function () {
        return false;
    }
};

var Galvanometer = function (x, y, name) {
    this.width = 90;
    this.height = 30;
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.value = "00";
    this.maxValue = 60;
    this.minValue = -60;
    this.A = new point(canvas.id, null, this.x + 3, this.y + this.height / 2, 4, pointType.PASSIVE, "A", this);
    this.B = new point(canvas.id, null, this.x + this.width - 3, this.y + this.height / 2, 4, pointType.PASSIVE, "B", this);
    this.A.V = 0;
    this.B.V = 0;
    this.name = name;
    this.draw = function () {

        canvas.context.beginPath();
        canvas.context.rect(this.x + 7.5, this.y, this.width - 15, this.height);
        canvas.context.lineWidth = "1";
        canvas.context.strokeStyle = "black";
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.font = "24px digitalFont";
        canvas.context.fillStyle = "grey";
        canvas.context.fillText(this.value, this.x + this.width / 2 - 12, this.y + this.height / 2 + 9);

        canvas.context.font = "12px Arial";
        canvas.context.fillStyle = "black";
        canvas.context.fillText(name, this.x + this.width / 2 - 4, this.y + this.height / 2 + 30);

        this.A.draw();
        this.B.draw();
        this.update();
    }
    this.isInside = function () {

    }
    this.update = function () {
        let value = this.A.V - this.B.V;
        this.value = value;
        //canvas.draw();
    }
    this.operate = function () {
        this.update();
    }
};

var Potentiometer = function (x, y, name) {
    this.width = 10;
    this.height = 10;
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.A = new point(canvas.id, null, this.x + 40, this.y + 25, 4, pointType.PASSIVE, "A", this);
    this.O = new point(canvas.id, null, this.x + 10, this.y + 10, 4, pointType.ACTIVE_PASSIVE, "O", this);
    this.B = new point(canvas.id, null, this.x + 10, this.y + 40, 4, pointType.PASSIVE, "B", this);
    this.name = name;
    this.draw = function () {
        canvas.context.font = "12px Arial";
        canvas.context.fillStyle = "black";
        canvas.context.fillText(name, this.x + this.width / 2 - 4, this.y + this.height / 2 + 30);
        this.A.draw();
        this.O.draw();
        this.B.draw();
    };
    this.isInside = function () {

    }
};

var Condenser = function (x, y, name) {
    this.width = 30;
    this.height = 30;
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.r = 25;

    this.R = 0;
    this.C = 30;
    this.V = 0;

    this.A = new point(canvas.id, null, this.x, this.y + this.height / 2, 4, pointType.ACTIVE_PASSIVE, "A", this);
    this.B = new point(canvas.id, null, this.x + 28, this.y + this.height / 2, 4, pointType.ACTIVE_PASSIVE, "B", this);
    this.name = name;
    this.draw = function () {
        canvas.context.beginPath();
        canvas.context.arc(this.x + this.width / 2, this.y + this.height / 2, this.r, 0, 2 * Math.PI);
        canvas.context.lineWidth = "2";
        canvas.context.strokeStyle = "black";
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.font = "12px Arial";
        canvas.context.fillStyle = "black";
        canvas.context.fillText(name, this.x + this.width / 2 - 4, this.y + this.height / 2 + 30);

        this.A.draw();
        this.B.draw();
    }
    this.isInside = function () {

    }
    this.charge = function () {
        if (this.A.V > this.B.V) {
            let Vs = this.A.V - this.B.V;
            this.V = Vs * Math.pow(2.7183, -(15 / (this.R * this.C)));
        } else if (this.B.V > 0) {

        }
    }
    this.discharge = function () {

    }
};

var Canvas = function () {
    this.elementCount = {

    }
    this.id = "myCanvas";
    this.obj = document.getElementById(this.id);
    this.width = window.innerWidth
        || document.documentElement.clientWidth
        || document.body.clientWidth;
    this.height = h = window.innerHeight
        || document.documentElement.clientHeight
        || document.body.clientHeight;
    this.obj.setAttribute("width", this.width * 0.7);
    this.obj.setAttribute("height", this.height * 0.8);
    this.context = this.obj.getContext('2d');
    this.element = [];
    this.connection = [];
    this.redoArray = [];
    this.action = null;
    this.currentElement = null;
    this.timeInterval = null;
    this.battery = "hdsjf";
    this.draw = function () {
        this.context.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementsByTagName("body")[0].style.cursor = "default";
        for (let ele in this.element) {
            this.element[ele].draw();
        }
        for (var con in this.connection) {
            this.connection[con].draw();
        }
    }
    this.reset = function () {
        this.element = [];
        this.connection = [];
        this.draw();
        terminal.update("Reset Done..");
    }
    this.undo = function () {
        if (canvas.element.length > 0) {
            canvas.redoArray.push(canvas.element.pop());
            canvas.draw();
            terminal.update("Undo Done..");
        }
    }
    this.redo = function () {
        if (canvas.redoArray.length > 0) {
            canvas.element.push(canvas.redoArray.pop());
            canvas.draw();
            terminal.update("Redo Done..");
        }
    }

    this.start = function () {

        if (canvas.element.length == 19) {
            for (let i = 0; i < buttons.length; i++) {
                if (operationType[buttons[i].getAttribute("vlab-action")] == operationType.STOP_SIMULATION) {
                    buttons[i].classList.remove("disabled");
                    buttons[i].removeAttribute("disabled");
                    continue;
                }
                buttons[i].classList.add("disabled");
                buttons[i].setAttribute("disabled", "true");
            }

            this.run();
            terminal.update("Simulation Started");
        }
    }
    this.stop = function () {
        for (let i = 0; i < buttons.length; i++) {
            if (operationType[buttons[i].getAttribute("vlab-action")] == operationType.STOP_SIMULATION) {
                buttons[i].classList.add("disabled");
                buttons[i].setAttribute("disabled", "true");
                continue;
            }
            buttons[i].classList.remove("disabled");
            buttons[i].removeAttribute("disabled");
        }
        terminal.update("Simulation Stopped");
        clearInterval(this.timeInterval);
        timeInterval = null;
    }

    this.run = function () {
        runnable();
    }
};

var runnable = function () {

    canvas.draw();
}

window.onload = function () {
    window.terminal = new Terminal();
    window.canvas = new this.Canvas();
    window.buttons = this.document.getElementsByClassName("btn");
    canvas.stop();
    this.document.addEventListener("mousedown", function (e) {
        var tempPos = getMousePos(window.canvas.obj, e);
        update(tempPos.x, tempPos.y);
        if (typeof mouseLeftDown === "function") {
            if (e.button == 0)
                mouseLeftDown(tempPos.x, tempPos.y);
        }
    }, false);

    this.document.addEventListener("mousemove", function (e) {
        var tempPos = getMousePos(window.canvas.obj, e);
        update(tempPos.x, tempPos.y);
        if (typeof mouseMove === "function") {
            mouseMove(tempPos.x, tempPos.y);
        }
    }, false);

    //attach Listener
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("click", function (e) {
            var vlab_action = e.target.getAttribute("vlab-action");
            vlab_action = operationType[vlab_action];
            switch (vlab_action) {
                case operationType.DRAW_POINT:
                    canvas.action = operationType.DRAW_POINT;
                    break;
                case operationType.DRAW_POTENTIOMETER:
                    canvas.action = operationType.DRAW_POTENTIOMETER;
                    break;
                case operationType.DRAW_RESISTOR:
                    canvas.action = operationType.DRAW_RESISTOR;
                    break;
                case operationType.DRAW_TAPKEY:
                    canvas.action = operationType.DRAW_TAPKEY;
                    break;
                case operationType.DRAW_CELL:
                    canvas.action = operationType.DRAW_CELL;
                    break;
                case operationType.DRAW_GALVANOMETER:
                    canvas.action = operationType.DRAW_GALVANOMETER;
                    break;
                case operationType.DRAW_TWO_WAY_KEY:
                    canvas.action = operationType.DRAW_TWO_WAY_KEY;
                    break;
                case operationType.DRAW_CONDENSER:
                    canvas.action = operationType.DRAW_CONDENSER;
                    break;
                case operationType.MAKE_CONNECTION:
                    canvas.action = operationType.MAKE_CONNECTION;
                    break;
                case operationType.START_SIMULATION:
                    canvas.action = operationType.START_SIMULATION;
                    canvas.start();
                    break;
                case operationType.STOP_SIMULATION:
                    canvas.action = operationType.STOP_SIMULATION;
                    canvas.stop();
                    break;
                case operationType.RESET:
                    canvas.action != operationType.START_SIMULATION ? canvas.reset() : "";
                    break;
                case operationType.UNDO:
                    canvas.action != operationType.START_SIMULATION ? canvas.undo() : "";
                    break;
                case operationType.REDO:
                    canvas.action != operationType.START_SIMULATION ? canvas.redo() : "";
                    break;
                default:
                    break;
            }
        }, false);
    }

    window.onkeypress = function (e) {
        switch (e.keyCode) {
            case 25:
                canvas.action != operationType.START_SIMULATION ? canvas.redo() : "";
                break;
            case 26:
                canvas.action != operationType.START_SIMULATION ? canvas.undo() : "";
                break;
            default:
                break;
        }
    }

    document.getElementsByClassName("loader")[0].style.display = "none";
    canvas.element.push(new point(canvas.id, null, 220, 300, 8, pointType.PASSIVE, "Z", null));
    canvas.draw();
};

function mouseLeftDown(x, y) {
    if (x > 0 && y > 0) {
        if (canvas.action == operationType.DRAW_POINT) {
            //canvas.element.push(new point(canvas.id, null, 220, 300, 8, pointType.PASSIVE, ""));
            //canvas.redoArray = [];
        } else if (canvas.action == operationType.MAKE_CONNECTION) {
            drawConnection(x, y, canvas.currentElement);
            canvas.redoArray = [];
        } else if (canvas.action == operationType.DRAW_TWO_WAY_KEY) {
            if (!checkInstance(TwoWayKey)) {
                canvas.twoWayKey = new TwoWayKey(640, 301, "K1");
                canvas.element.push(canvas.twoWayKey);
                canvas.redoArray = [];
            }
        } else if (canvas.action == operationType.DRAW_CELL) {
            if (!checkInstance(Cell)) {
                canvas.battery = new Cell(448, 500, "B");
                canvas.element.push(canvas.battery);
                canvas.redoArray = [];
            }
        } else if (canvas.action == operationType.DRAW_RESISTOR) {
            if (!checkInstance(Resistor)) {
                canvas.resistor = new Resistor(448, 380, "R");
                canvas.element.push(canvas.resistor);
                canvas.redoArray = [];
            }
        } else if (canvas.action == operationType.DRAW_GALVANOMETER) {
            if (!checkInstance(Galvanometer)) {
                canvas.galvanometer = new Galvanometer(448, 150, "G");
                canvas.element.push(canvas.galvanometer);
                canvas.redoArray = [];
            }
        } else if (canvas.action == operationType.DRAW_POTENTIOMETER) {
            if (!checkInstance(Potentiometer)) {
                canvas.potentiometer = new Potentiometer(x, y, "P")
                canvas.element.push(canvas.potentiometer);
                canvas.redoArray = [];
            }
        } else if (canvas.action == operationType.DRAW_TAPKEY) {
            if (!checkInstance(TapKey)) {
                canvas.tapKey_1 = new TapKey(548, 365, "K2");
                canvas.tapKey_2 = new TapKey(448, 217, "K3")
                canvas.element.push(canvas.tapKey_1);
                canvas.element.push(canvas.tapKey_2);
                canvas.redoArray = [];
            }
        }
        else if (canvas.action == operationType.DRAW_CONDENSER) {
            if (!checkInstance(Condenser)) {
                canvas.condenser = new Condenser(448, 300, "C");
                canvas.element.push(canvas.condenser);
                canvas.redoArray = [];
            }
        }

        if (canvas.action == operationType.START_SIMULATION) {
            if (canvas.currentElement instanceof TwoWayKey) {
                canvas.currentElement.click();
            } else if (canvas.currentElement instanceof TapKey) {
                canvas.currentElement.click();
            }
        }
    }
    console.log(canvas.element);
    canvas.draw();
    hover(x, y);
}

function mouseMove(x, y) {
    hover(x, y)
}

function hover(x, y) {
    for (var ele in canvas.element) {
        if (canvas.element[ele] instanceof point) {
            if (canvas.element[ele].isInside(x, y)) {
                canvas.currentElement = canvas.element[ele];
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
        } else if (canvas.element[ele] instanceof TwoWayKey) {
            if (canvas.element[ele].input.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].input;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else if (canvas.element[ele].outputA.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].outputA;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else if (canvas.element[ele].outputB.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].outputB;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
            if (canvas.element[ele].isInside(x, y)) {
                canvas.currentElement = canvas.element[ele];
                document.getElementsByTagName("body")[0].style.cursor = "pointer";
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
        } else if (canvas.element[ele] instanceof Resistor) {
            if (canvas.element[ele].A.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].A;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else if (canvas.element[ele].B.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].B;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
            if (canvas.element[ele].isInside(x, y)) {
                canvas.currentElement = canvas.element[ele];
                document.getElementsByTagName("body")[0].style.cursor = "pointer";
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
        } else if (canvas.element[ele] instanceof Cell) {
            if (canvas.element[ele].A.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].A;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else if (canvas.element[ele].B.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].B;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
            if (canvas.element[ele].isInside(x, y)) {
                canvas.currentElement = canvas.element[ele];
                document.getElementsByTagName("body")[0].style.cursor = "pointer";
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
        } else if (canvas.element[ele] instanceof Galvanometer) {
            if (canvas.element[ele].A.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].A;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else if (canvas.element[ele].B.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].B;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
            if (canvas.element[ele].isInside(x, y)) {
                canvas.currentElement = canvas.element[ele];
                document.getElementsByTagName("body")[0].style.cursor = "pointer";
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
        } else if (canvas.element[ele] instanceof Potentiometer) {
            if (canvas.element[ele].A.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].A;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else if (canvas.element[ele].O.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].O;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else if (canvas.element[ele].B.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].B;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
            if (canvas.element[ele].isInside(x, y)) {
                canvas.currentElement = canvas.element[ele];
                document.getElementsByTagName("body")[0].style.cursor = "pointer";
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
        } else if (canvas.element[ele] instanceof Condenser) {
            if (canvas.element[ele].A.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].A;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else if (canvas.element[ele].B.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].B;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
            if (canvas.element[ele].isInside(x, y)) {
                canvas.currentElement = canvas.element[ele];
                document.getElementsByTagName("body")[0].style.cursor = "pointer";
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
        } else if (canvas.element[ele] instanceof TapKey) {
            if (canvas.element[ele].input.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].input;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else if (canvas.element[ele].outputA.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].outputA;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
            if (canvas.element[ele].isInside(x, y)) {
                canvas.currentElement = canvas.element[ele];
                document.getElementsByTagName("body")[0].style.cursor = "pointer";
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
        }
    }
}

function checkInstance(name) {
    for (let i = 0; i < canvas.element.length; i++) {
        if (canvas.element[i] instanceof name) {
            return true;
        }
    }
    return false;
}

function drawConnection(x, y, ele) {
    if (!(ele instanceof point)) {
        return;
    }
    if (preCon == null) {
        preCon = ele;
    } else if (preCon != ele) {
        var temp = new Wire(preCon, ele, true);
        canvas.element.push(temp);
        preCon.connection.push(temp);
        ele.connection.push(temp);
        preCon = null;
    }
}

function WireCount() {
    var count = 0;
    for (let i = 0; i < canvas.element.length; i++) {
        if (canvas.element[i] instanceof Wire) {
            count++;
        }
    }
    return count;
}

function poinHoverCircle(x, y, r) {
    canvas.context.beginPath();
    canvas.context.arc(x, y, r, 0, 2 * Math.PI);
    canvas.context.strokeStyle = "lightblue";
    canvas.context.stroke();
    canvas.context.closePath();
    document.getElementsByTagName("body")[0].style.cursor = "pointer";
}