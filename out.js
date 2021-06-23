var Main;
(function (Main) {
    function Init(alleles) {
        var M_viewport = document.getElementById("viewer");
        var M_ctx = M_viewport.getContext("2d");
        var PS_viewport = document.getElementById("positionSelector");
        var PS_ctx = PS_viewport.getContext("2d");
        var viewer = new MatrixView.MatrixViewer(M_viewport, M_ctx);
        var pselector = new PositionSelector.State(PS_viewport, PS_ctx, new DataStore.zeroStore(), viewer);
        var sidebar = new Sidebar.Sidebar(document.getElementById("sidebar"), alleles, pselector);
        var button_alpha1 = document.getElementById("alpha1");
        var button_charge1 = document.getElementById("charge1");
        var button_size1 = document.getElementById("size1");
        var button_context1 = document.getElementById("context1");
        var button_reverse1 = document.getElementById("reverse1");
        var button_alpha2 = document.getElementById("alpha2");
        var button_charge2 = document.getElementById("charge2");
        var button_size2 = document.getElementById("size2");
        var button_context2 = document.getElementById("context2");
        var button_reverse2 = document.getElementById("reverse2");
        var button_zoom = document.getElementById("zoom");
        var alphabetical = ["A", "C", "D", "E", "F", "G", "H", "I", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V", "W", "Y"];
        var bycharge = ["H", "K", "R", "D", "E", "C", "G", "N", "Q", "S", "T", "Y", "A", "F", "I", "L", "M", "P", "V", "W"];
        var bysize = ["G", "A", "S", "C", "D", "P", "N", "T", "E", "V", "Q", "H", "M", "I", "L", "K", "R", "F", "Y", "W"];
        button_alpha1.onclick = function () { return viewer.UpdateGridOrder(alphabetical, true); };
        button_charge1.onclick = function () { return viewer.UpdateGridOrder(bycharge, true); };
        button_size1.onclick = function () { return viewer.UpdateGridOrder(bysize, true); };
        button_context1.onclick = function () { return viewer.UpdateOrderByMarginal(true); };
        button_reverse1.onclick = function () { return viewer.ReveseOrder(true); };
        button_alpha2.onclick = function () { return viewer.UpdateGridOrder(alphabetical, false); };
        button_charge2.onclick = function () { return viewer.UpdateGridOrder(bycharge, false); };
        button_size2.onclick = function () { return viewer.UpdateGridOrder(bysize, false); };
        button_context2.onclick = function () { return viewer.UpdateOrderByMarginal(false); };
        button_reverse2.onclick = function () { return viewer.ReveseOrder(false); };
        var currentState = false;
        button_zoom.onclick = function () {
            currentState = !currentState;
            pselector.UpdateNormalizeViewer(currentState);
            button_zoom.innerHTML = currentState ? "-" : "+";
        };
    }
    Main.Init = Init;
})(Main || (Main = {}));
var DataStore;
(function (DataStore) {
    var dummyStore = (function () {
        function dummyStore() {
            this.gridNumber = [];
            this.tetrad = [];
            for (var i = 0; i < 9; i++) {
                var subnumber = [];
                var subtetrad = [];
                for (var j = 0; j < 9; j++) {
                    subnumber.push(Math.random());
                    var submatrix = [];
                    for (var aa1 = 0; aa1 < 20; aa1++) {
                        var subvector = [];
                        for (var aa2 = 0; aa2 < 20; aa2++) {
                            if (i == j) {
                                if (aa1 == aa2)
                                    subvector.push(Math.random() * 2 - 1);
                                else
                                    subvector.push(0);
                            }
                            else {
                                subvector.push(Math.random() * 2 - 1);
                            }
                        }
                        submatrix.push(subvector);
                    }
                    subtetrad.push(submatrix);
                }
                this.gridNumber.push(subnumber);
                this.tetrad.push(subtetrad);
            }
        }
        dummyStore.prototype.GetPositionSpectrum = function (i, j, normalize) {
            return this.gridNumber[i][j];
        };
        dummyStore.prototype.GetGrid = function (i, j, normalize) {
            return this.tetrad[i][j];
        };
        dummyStore.prototype.GetMargin = function (i, normalize) {
            var margin = [];
            for (var j = 0; j < 20; j++) {
                margin.push(this.tetrad[i][i][j][j]);
            }
            return margin;
        };
        dummyStore.prototype.GetName = function () {
            return "DUMMY";
        };
        return dummyStore;
    }());
    DataStore.dummyStore = dummyStore;
})(DataStore || (DataStore = {}));
var DataStore;
(function (DataStore) {
    var modelStore = (function () {
        function modelStore(decodeJson) {
            this.tensor = [];
            this.firstOrder = [];
            this.sizes = [];
            this.zeroMatrix = [];
            this.zeroVector = [];
            for (var i = 0; i < 20; i++) {
                this.zeroMatrix.push(this.zeroVector);
                this.zeroVector.push(0);
            }
            for (var i = 0; i < 9; i++) {
                var tVec = [];
                var tVec2 = [];
                for (var j = 0; j < 9; j++) {
                    tVec.push(this.zeroMatrix);
                    tVec2.push(0);
                }
                this.tensor.push(tVec);
                this.sizes.push(tVec2);
            }
            var index = 1;
            var maxValAll = 0;
            var sqtwenty = Math.sqrt(20);
            for (var i = 0; i < 9; i++) {
                this.firstOrder.push(decodeJson[index]);
                this.firstOrder[this.firstOrder.length - 1] = this.firstOrder[this.firstOrder.length - 1].map(function (x) { return x * sqtwenty; });
                maxValAll = Math.max(maxValAll, this.getMaxInVector(this.firstOrder[this.firstOrder.length - 1]));
                index++;
            }
            for (var i = 0; i < 9; i++) {
                for (var j = 0; j < i; j++) {
                    this.tensor[i][j] = decodeJson[index];
                    this.tensor[j][i] = decodeJson[index];
                    maxValAll = Math.max(maxValAll, this.getMaxInMatrix(this.tensor[i][j]));
                    index++;
                }
            }
            this.maxUnit = maxValAll;
            var maxSize = 0;
            for (var i = 0; i < this.firstOrder.length; i++) {
                var size = Math.pow(this.firstOrder[i].reduce(function (previous, current) { return previous + Math.pow(current, 2); }, 0) / 400, 0.5);
                this.sizes[i][i] = size;
                maxSize = Math.max(size, maxSize);
            }
            for (var i = 0; i < 9; i++) {
                for (var j = 0; j < i; j++) {
                    var size = Math.pow(this.tensor[i][j].reduce(function (previous, current) {
                        return previous + current.reduce(function (previous, current) { return previous + Math.pow(current, 2); }, 0);
                    }, 0) / 400, 0.5);
                    this.sizes[i][j] = size;
                    this.sizes[j][i] = size;
                    maxSize = Math.max(size, maxSize);
                }
            }
            for (var i = 0; i < 9; i++) {
                for (var j = 0; j < 9; j++) {
                    this.sizes[i][j] = this.sizes[i][j] / maxSize;
                }
            }
            return;
        }
        modelStore.prototype.GetPositionSpectrum = function (i, j, normalize) { return this.sizes[i][j]; };
        modelStore.prototype.GetGrid = function (i, j, normalize) {
            return normalize ? this.normalizeMatrix(this.tensor[i][j]) : this.normalizeMatrixByF(this.tensor[i][j], this.maxUnit);
        };
        modelStore.prototype.GetMargin = function (i, normalize) {
            return normalize ? this.normalizeVector(this.firstOrder[i]) : this.normalizeVectorByF(this.firstOrder[i], this.maxUnit);
        };
        modelStore.prototype.GetName = function () { return ""; };
        modelStore.prototype.normalizeMatrix = function (matrix) {
            return this.normalizeMatrixByF(matrix, this.getMaxInMatrix(matrix));
        };
        modelStore.prototype.normalizeVector = function (vector) {
            return this.normalizeVectorByF(vector, this.getMaxInVector(vector));
        };
        modelStore.prototype.normalizeMatrixByF = function (matrix, denom) {
            var _this = this;
            return matrix.map(function (x) { return _this.normalizeVectorByF(x, denom); });
        };
        modelStore.prototype.normalizeVectorByF = function (vector, denom) {
            return vector.map(function (x) { return x / denom; });
        };
        modelStore.prototype.getMaxInMatrix = function (matrix) {
            var _this = this;
            return matrix.reduce(function (prev, cur) { return Math.max(prev, _this.getMaxInVector(cur)); }, 0);
        };
        modelStore.prototype.getMaxInVector = function (vector) {
            return vector.reduce(function (prev, cur) { return Math.max(prev, Math.abs(cur), 0); });
        };
        return modelStore;
    }());
    DataStore.modelStore = modelStore;
})(DataStore || (DataStore = {}));
var DataStore;
(function (DataStore) {
    var zeroStore = (function () {
        function zeroStore() {
            this.zeroMatrix = [];
            this.zeroVector = [];
            for (var i = 0; i < 20; i++) {
                this.zeroMatrix.push(this.zeroVector);
                this.zeroVector.push(0);
            }
            return;
        }
        zeroStore.prototype.GetPositionSpectrum = function (i, j, normalize) { return 0; };
        zeroStore.prototype.GetGrid = function (i, j, normalize) { return this.zeroMatrix; };
        zeroStore.prototype.GetMargin = function (i, normalize) { return this.zeroVector; };
        zeroStore.prototype.GetName = function () { return ""; };
        return zeroStore;
    }());
    DataStore.zeroStore = zeroStore;
})(DataStore || (DataStore = {}));
var MatrixView;
(function (MatrixView) {
    var Dial = (function () {
        function Dial(aa, totalaa) {
            this.hooked = false;
            this.hookDisplace = 0;
            this.animateSlide = 0;
            this.maxAnimateSlide = 15;
            this.highlight = 0;
            this.maxHighlight = 10;
            this.aa = aa;
            this.slot = aa;
            this.totalaa = totalaa;
            this.x = this.slot / this.totalaa;
            this.xPrevious = this.x;
        }
        Dial.prototype.GetPosition = function () {
            var interpolate = Math.pow(this.animateSlide / this.maxAnimateSlide, 2);
            return (this.x * (1 - interpolate)) + (this.xPrevious * interpolate);
        };
        Dial.prototype.GetSortPosition = function () {
            if (this.hooked)
                return this.GetPosition();
            else
                return this.slot / this.totalaa;
        };
        Dial.prototype.GetHighlight = function () {
            return this.highlight / this.maxHighlight;
        };
        Dial.prototype.IsSelected = function (mouseX) {
            return (this.slot / this.totalaa < mouseX) && ((this.slot / this.totalaa) + (1 / this.totalaa) > mouseX);
        };
        Dial.prototype.Step = function (mouseX, enableHighlights) {
            if (this.hooked) {
                this.x = Math.max(mouseX + this.hookDisplace, -0.5 / this.totalaa);
            }
            this.animateSlide = Math.max(this.animateSlide - 1, 0);
            var engageHighlight = (enableHighlights && this.IsSelected(mouseX)) || this.hooked;
            if (engageHighlight)
                this.highlight = Math.min(this.highlight + 5, this.maxHighlight);
            else
                this.highlight = Math.max(this.highlight - 1, 0);
            if (this.animateSlide == 0 && !this.hooked
                && (this.highlight == this.maxHighlight || !engageHighlight)
                && (this.highlight == 0 || engageHighlight)) {
                return false;
            }
            else {
                return true;
            }
        };
        Dial.prototype.UpdateSlot = function (i) {
            if (i != this.slot) {
                this.slot = i;
                if (!this.hooked) {
                    this.xPrevious = this.x;
                    this.animateSlide = this.maxAnimateSlide;
                    this.x = this.slot / this.totalaa;
                }
            }
        };
        Dial.prototype.Hook = function (mouseX) {
            this.hookDisplace = this.x - mouseX;
            this.hooked = true;
        };
        Dial.prototype.UnHook = function () {
            this.hooked = false;
            this.xPrevious = this.x;
            this.animateSlide = this.maxAnimateSlide;
            this.x = this.slot / this.totalaa;
        };
        return Dial;
    }());
    MatrixView.Dial = Dial;
})(MatrixView || (MatrixView = {}));
var MatrixView;
(function (MatrixView) {
    var MatrixViewer = (function () {
        function MatrixViewer(canvas, ctx) {
            var _this = this;
            this.aa = ["A", "C", "D", "E", "F", "G", "H", "I", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V", "W", "Y"];
            this.glyphsPositive = [];
            this.glyphsNegative = [];
            this.glyphsNeutral = [];
            this.zeroMatrix = [];
            this.zeroVector = [];
            this.hDials = [];
            this.vDials = [];
            this.hookedDialX = null;
            this.hookedDialY = null;
            this.selectedi = 0;
            this.selectedj = 0;
            this.animateGrid = 0;
            this.maxAnimateGrid = 20;
            this.sleeping = false;
            this.aaToIndex = new Map();
            for (var i = 0; i < this.aa.length; i++) {
                this.aaToIndex.set(this.aa[i], i);
            }
            this.mCanvas = canvas;
            this.mCtx = ctx;
            this.mCtx.lineCap = "round";
            this.width = this.mCanvas.width;
            this.height = this.mCanvas.height;
            this.thinMarginX = this.width / 22;
            this.thinMarginY = this.height / 22;
            this.marginSizeX = ((this.width - this.thinMarginX) / 21) + this.thinMarginX;
            this.marginSizeY = ((this.height - this.thinMarginY) / 21) + this.thinMarginY;
            for (var i = 0; i < 20; i++) {
                this.hDials.push(new MatrixView.Dial(i, 20));
                this.vDials.push(new MatrixView.Dial(i, 20));
                this.zeroVector.push(0);
                this.zeroMatrix.push(this.zeroVector);
            }
            this.aagrid = this.zeroMatrix;
            this.previousAAgrid = this.zeroMatrix;
            this.marginGridX = this.zeroVector;
            this.marginGridY = this.zeroVector;
            this.prevMarginX = this.zeroVector;
            this.prevMarginY = this.zeroVector;
            this.sleeping = false;
            this.mouseX = 0;
            this.mouseY = 0;
            this.mCanvas.addEventListener("mousemove", function (e) { return _this.OnInteraction(e, false, false, true); });
            this.mCanvas.addEventListener("mousedown", function (e) { return _this.OnInteraction(e, true, false, true); });
            this.mCanvas.addEventListener("mouseup", function (e) { return _this.OnInteraction(e, true, true, true); });
            this.mCanvas.addEventListener("mouseleave", function (e) { return _this.OnInteraction(e, true, true, false); });
            this.loadLetters(0);
        }
        MatrixViewer.prototype.UpdateGridValues = function (grid, margini, marginj, i, j) {
            this.selectedi = i;
            this.selectedj = j;
            this.previousAAgrid = this.aagrid;
            this.prevMarginX = this.marginGridX;
            this.prevMarginY = this.marginGridY;
            this.animateGrid = this.maxAnimateGrid;
            this.aagrid = (i == j) ? this.zeroMatrix : grid;
            this.marginGridX = margini;
            this.marginGridY = (i == j) ? this.zeroVector : marginj;
            if (this.sleeping) {
                this.sleeping = false;
                this.Step();
            }
            return;
        };
        MatrixViewer.prototype.UpdateOrderByMarginal = function (x) {
            if (x)
                this.UpdateOrderByMarginalHelper(this.marginGridX, this.hDials, x);
            else
                this.UpdateOrderByMarginalHelper(this.marginGridY, this.vDials, x);
        };
        MatrixViewer.prototype.UpdateOrderByMarginalHelper = function (margin, dials, x) {
            var sizeAndDials = [];
            for (var i = 0; i < dials.length; i++) {
                sizeAndDials.push([margin[dials[i].aa], this.aa[dials[i].aa]]);
            }
            sizeAndDials.sort(function (a, b) { return (a[0] - b[0]); });
            this.UpdateGridOrder(sizeAndDials.map(function (x) { return x[1]; }), x);
        };
        MatrixViewer.prototype.ReveseOrder = function (x) {
            var _this = this;
            this.UpdateGridOrder((x ? this.hDials : this.vDials).map(function (x) { return _this.aa[x.aa]; }).reverse(), x);
        };
        MatrixViewer.prototype.UpdateGridOrder = function (perm, x) {
            var m = new Map();
            for (var i = 0; i < perm.length; i++) {
                m.set(perm[i], i);
            }
            if (x)
                this.UpdateGridOrderInternal(perm, this.hDials, m);
            else
                this.UpdateGridOrderInternal(perm, this.vDials, m);
            if (this.sleeping) {
                this.sleeping = false;
                this.Step();
            }
            return;
        };
        MatrixViewer.prototype.UpdateGridOrderInternal = function (perm, dial, m) {
            for (var i = 0; i < dial.length; i++) {
                dial[i].UpdateSlot(m.get(this.aa[dial[i].aa]));
            }
        };
        MatrixViewer.prototype.OnInteraction = function (e, click, up, mouseInWindow) {
            this.mouseInWindow = mouseInWindow;
            this.mouseX = e.x - this.mCanvas.getBoundingClientRect().left;
            this.mouseY = e.y - this.mCanvas.getBoundingClientRect().top;
            if (click) {
                if (this.hookedDialX != null) {
                    this.hookedDialX.UnHook();
                    this.hookedDialX = null;
                }
                if (this.hookedDialY != null) {
                    this.hookedDialY.UnHook();
                    this.hookedDialY = null;
                }
                if (!up) {
                    var xloc = this.transformX(this.mouseX);
                    for (var i = 0; i < this.hDials.length; i++) {
                        if (this.hDials[i].IsSelected(xloc)) {
                            this.hookedDialX = this.hDials[i];
                            break;
                        }
                    }
                    if (this.hookedDialX != null)
                        this.hookedDialX.Hook(xloc);
                    var yloc = this.transformY(this.mouseY);
                    for (var i = 0; i < this.vDials.length; i++) {
                        if (this.vDials[i].IsSelected(yloc)) {
                            this.hookedDialY = this.vDials[i];
                            break;
                        }
                    }
                    if (this.hookedDialY != null)
                        this.hookedDialY.Hook(yloc);
                }
            }
            if (this.sleeping) {
                this.sleeping = false;
                this.Step();
            }
            return;
        };
        MatrixViewer.prototype.Step = function () {
            var _this = this;
            this.hDials.sort(function (a, b) { return a.GetSortPosition() - b.GetSortPosition(); });
            this.vDials.sort(function (a, b) { return a.GetSortPosition() - b.GetSortPosition(); });
            for (var i = 0; i < this.hDials.length; i++)
                this.hDials[i].UpdateSlot(i);
            for (var i = 0; i < this.vDials.length; i++)
                this.vDials[i].UpdateSlot(i);
            this.animateGrid = Math.max(this.animateGrid - 1, 0);
            var updateNeeded = this.animateGrid != 0;
            for (var i = 0; i < this.hDials.length; i++) {
                var changed = this.hDials[i].Step(this.transformX(this.mouseX), this.hookedDialX == null && this.hookedDialY == null && this.mouseInWindow);
                updateNeeded = updateNeeded || changed;
            }
            for (var i = 0; i < this.vDials.length; i++) {
                var changed = this.vDials[i].Step(this.transformY(this.mouseY), this.hookedDialX == null && this.hookedDialY == null && this.mouseInWindow);
                updateNeeded = updateNeeded || changed;
            }
            this.Draw();
            if (updateNeeded) {
                setTimeout(function () { return _this.Step(); }, 16.6);
            }
            else {
                this.sleeping = true;
            }
            return;
        };
        MatrixViewer.prototype.Draw = function () {
            var _this = this;
            this.mCtx.clearRect(0, 0, this.width, this.height);
            var blockW = (this.width - this.marginSizeX) / this.hDials.length;
            var blockH = (this.height - this.marginSizeY) / this.vDials.length;
            var hPositions = this.hDials.map(function (x) { return _this.invTransformX(x.GetPosition()); });
            var vPositions = this.vDials.map(function (y) { return _this.invTransformY(y.GetPosition()); });
            var t = Math.pow(this.animateGrid / this.maxAnimateGrid, 2);
            for (var i = 0; i < hPositions.length; i++) {
                var xloc = hPositions[i];
                for (var j = 0; j < vPositions.length; j++) {
                    var yloc = vPositions[j];
                    var r = (this.aagrid[this.hDials[i].aa][this.vDials[j].aa] * (1 - t)) +
                        (this.previousAAgrid[this.hDials[i].aa][this.vDials[j].aa] * t);
                    this.mCtx.fillStyle = (r > 0) ? "red" : "blue";
                    this.mCtx.globalAlpha = Math.abs(r) * 0.5;
                    this.mCtx.fillRect(xloc, yloc, blockW, blockH);
                }
            }
            this.mCtx.globalAlpha = 1;
            this.mCtx.globalAlpha = 0.1;
            this.mCtx.fillStyle = "#000000";
            this.mCtx.strokeStyle = "#000000";
            this.mCtx.fillRect(Math.round(this.thinMarginX), this.thinMarginY, Math.round(blockW), this.height);
            this.mCtx.fillRect(Math.round(this.thinMarginX) + Math.round(blockW), this.thinMarginY, this.width, blockH);
            this.mCtx.strokeRect(this.thinMarginX, this.thinMarginY, this.width - this.thinMarginX - 1, this.height - this.thinMarginY - 1);
            for (var i = 0; i < hPositions.length; i++) {
                this.lineTo(hPositions[i], this.marginSizeY, hPositions[i], this.height, this.mCtx);
                this.lineTo(hPositions[i] + blockW, this.marginSizeY, hPositions[i] + blockW, this.height, this.mCtx);
            }
            for (var i = 0; i < vPositions.length; i++) {
                this.lineTo(this.marginSizeX, vPositions[i], this.width, vPositions[i], this.mCtx);
                this.lineTo(this.marginSizeX, vPositions[i] + blockH, this.width, vPositions[i] + blockH, this.mCtx);
            }
            this.mCtx.globalAlpha = 1;
            this.mCtx.fillStyle = "#000000";
            this.mCtx.font = "bold 16px sans-serif";
            this.mCtx.textAlign = "center";
            var vfix = 8;
            this.mCtx.fillText('P' + (this.selectedi + 1), this.thinMarginX + (blockW / 2), this.thinMarginY / 2 + vfix);
            this.mCtx.fillText((this.selectedi == this.selectedj) ? "N/A" : 'P' + (this.selectedj + 1), this.thinMarginX / 2, this.thinMarginY + (blockH / 2) + vfix);
            this.drawHighlight(hPositions, vPositions, blockW, blockH);
            var drawAtEnd = [];
            var drawAtVeryEnd = null;
            var _loop_1 = function (i) {
                var xloc = hPositions[i];
                var _loop_4 = function (j) {
                    var yloc = vPositions[j];
                    var f = function () {
                        var r = (_this.aagrid[_this.hDials[i].aa][_this.vDials[j].aa] * (1 - t)) +
                            (_this.previousAAgrid[_this.hDials[i].aa][_this.vDials[j].aa] * t);
                        _this.drawLetter(r, DrawAlignment.Left, _this.vDials[j].aa, xloc, yloc, blockW / 2, blockH);
                        _this.drawLetter(r, DrawAlignment.Right, _this.hDials[i].aa, xloc + blockW / 2, yloc, blockW / 2, blockH);
                    };
                    if (this_1.hDials[i] === this_1.hookedDialX && this_1.vDials[j] === this_1.hookedDialY)
                        drawAtVeryEnd = f;
                    else if (this_1.hDials[i] === this_1.hookedDialX || this_1.vDials[j] === this_1.hookedDialY)
                        drawAtEnd.push(f);
                    else
                        f();
                };
                for (var j = 0; j < vPositions.length; j++) {
                    _loop_4(j);
                }
            };
            var this_1 = this;
            for (var i = 0; i < hPositions.length; i++) {
                _loop_1(i);
            }
            for (var i = 0; i < drawAtEnd.length; i++)
                drawAtEnd[i]();
            if (drawAtVeryEnd != null)
                drawAtVeryEnd();
            var endDrawX = null;
            var _loop_2 = function (i) {
                var f = function () {
                    var xloc = hPositions[i];
                    var r = (_this.marginGridX[_this.hDials[i].aa] * (1 - t)) +
                        (_this.prevMarginX[_this.hDials[i].aa] * t);
                    _this.drawLetter(r, DrawAlignment.Center, _this.hDials[i].aa, xloc, _this.thinMarginY, blockW, blockH);
                    _this.mCtx.drawImage(_this.glyphsNeutral[_this.hDials[i].aa], xloc, 0, blockW, _this.thinMarginY);
                };
                if (this_2.hDials[i] == this_2.hookedDialX)
                    endDrawX = f;
                else
                    f();
            };
            var this_2 = this;
            for (var i = 0; i < hPositions.length; i++) {
                _loop_2(i);
            }
            if (endDrawX != null)
                endDrawX();
            var endDrawY = null;
            var _loop_3 = function (i) {
                var f = function () {
                    var yloc = vPositions[i];
                    var r = (_this.marginGridY[_this.vDials[i].aa] * (1 - t)) +
                        (_this.prevMarginY[_this.vDials[i].aa] * t);
                    _this.drawLetter(r, DrawAlignment.Center, _this.vDials[i].aa, _this.thinMarginX, yloc, blockW, blockH);
                    _this.mCtx.drawImage(_this.glyphsNeutral[_this.vDials[i].aa], 0, yloc, _this.thinMarginX, blockH);
                };
                if (this_3.vDials[i] == this_3.hookedDialY)
                    endDrawY = f;
                else
                    f();
            };
            var this_3 = this;
            for (var i = 0; i < vPositions.length; i++) {
                _loop_3(i);
            }
            if (endDrawY != null)
                endDrawY();
        };
        MatrixViewer.prototype.lineTo = function (x1, y1, x2, y2, ctx) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        };
        MatrixViewer.prototype.drawLetter = function (size, alignment, letterIndex, x, y, w, h) {
            var img = (size > 0) ? this.glyphsPositive[letterIndex] : this.glyphsNegative[letterIndex];
            var r = Math.abs(size);
            var xdraw = (alignment == DrawAlignment.Left) ? x + (w * (1 - r)) :
                (alignment == DrawAlignment.Right) ? x : x + (w * (1 - r) / 2);
            var ydraw = y + (h * (1 - r) / 2);
            this.mCtx.drawImage(img, xdraw, ydraw, w * r, h * r);
        };
        MatrixViewer.prototype.drawHighlight = function (hPositions, vPositions, blockW, blockH) {
            this.mCtx.strokeStyle = "black";
            for (var i = 0; i < hPositions.length; i++) {
                var h = this.hDials[i].GetHighlight();
                if (h > 0) {
                    var xloc = hPositions[i];
                    this.mCtx.globalAlpha = h * 0.25;
                    this.mCtx.globalAlpha = h / 2;
                    this.mCtx.lineWidth = h * 3;
                    this.mCtx.strokeRect(xloc, 0, blockW, this.height);
                    this.mCtx.lineWidth = 1;
                }
            }
            for (var i = 0; i < vPositions.length; i++) {
                var h = this.vDials[i].GetHighlight();
                if (h > 0) {
                    var yloc = vPositions[i];
                    this.mCtx.globalAlpha = h * 0.25;
                    this.mCtx.globalAlpha = h / 2;
                    this.mCtx.lineWidth = h * 3;
                    this.mCtx.strokeRect(0, yloc, this.width, blockH);
                    this.mCtx.lineWidth = 1;
                }
            }
            this.mCtx.globalAlpha = 1;
        };
        MatrixViewer.prototype.transformX = function (x) { return (x - this.marginSizeX) / (this.width - this.marginSizeX); };
        MatrixViewer.prototype.transformY = function (y) { return (y - this.marginSizeY) / (this.height - this.marginSizeY); };
        MatrixViewer.prototype.invTransformX = function (x) { return (x * (this.width - this.marginSizeX)) + this.marginSizeX; };
        MatrixViewer.prototype.invTransformY = function (y) { return (y * (this.height - this.marginSizeY)) + this.marginSizeY; };
        MatrixViewer.prototype.loadLetters = function (i) {
            var _this = this;
            this.mCtx.clearRect(0, 0, this.width, this.height);
            var x = this.width / 4;
            var w = this.width / 2;
            var y = this.height / 2;
            var h = this.height / 30;
            this.mCtx.strokeStyle = "black";
            this.mCtx.fillStyle = "black";
            this.mCtx.font = "bold 16px sans-serif";
            this.mCtx.textAlign = "center";
            this.mCtx.lineWidth = 5;
            this.mCtx.strokeRect(x, y, w, h);
            this.mCtx.fillRect(x, y, w * (i / 20), h);
            this.mCtx.fillText("LOADING", x + w / 2, y - 10);
            this.mCtx.lineWidth = 1;
            if (i == 20) {
                this.Step();
            }
            else {
                var src = "./images/" + this.aa[i] + ".png";
                var img_1 = new Image;
                img_1.addEventListener('load', function () {
                    _this.glyphsPositive.push(_this.colorImage(img_1, 'red'));
                    _this.glyphsNegative.push(_this.colorImage(img_1, 'blue'));
                    var col = "black";
                    switch (_this.aa[i]) {
                        case "G":
                        case "S":
                        case "T":
                        case "Y":
                        case "C":
                        case "Q":
                        case "N":
                            col = "LimeGreen";
                            break;
                        case "K":
                        case "R":
                        case "H":
                            col = "blue";
                            break;
                        case "D":
                        case "E":
                            col = "red";
                            break;
                        default:
                            col = "black";
                    }
                    _this.glyphsNeutral.push(_this.colorImage(img_1, col));
                    _this.loadLetters(i + 1);
                }, false);
                img_1.src = src;
            }
        };
        MatrixViewer.prototype.colorImage = function (image, color) {
            var scratch_canvas = document.createElement('canvas');
            scratch_canvas.width = image.width;
            scratch_canvas.height = image.height;
            var scratch_ctx = scratch_canvas.getContext('2d');
            scratch_ctx.drawImage(image, 0, 0);
            scratch_ctx.globalCompositeOperation = "source-in";
            scratch_ctx.fillStyle = color;
            scratch_ctx.fillRect(0, 0, image.width, image.height);
            return scratch_canvas;
        };
        return MatrixViewer;
    }());
    MatrixView.MatrixViewer = MatrixViewer;
    var DrawAlignment;
    (function (DrawAlignment) {
        DrawAlignment[DrawAlignment["Left"] = 0] = "Left";
        DrawAlignment[DrawAlignment["Right"] = 1] = "Right";
        DrawAlignment[DrawAlignment["Center"] = 2] = "Center";
    })(DrawAlignment || (DrawAlignment = {}));
})(MatrixView || (MatrixView = {}));
var PositionSelector;
(function (PositionSelector) {
    var knob = (function () {
        function knob(i, j, leftChild, rightChild, width, height, radius) {
            this.previousRadius = 0;
            this.xjitter = 0;
            this.yjitter = 0;
            this.thickLeft = false;
            this.thickRight = false;
            this.iselected = 0;
            this.jselected = 0;
            this.animateBounce = 0;
            this.animateSize = 0;
            this.spinCycle = 0;
            this.pieceSize = 0;
            this.edgeWidthLeft = 0;
            this.edgeWidthRight = 0;
            this.maxBounce = 5;
            this.maxBounceSmall = 3;
            this.maxPieceSize = 15;
            this.maxEdgeWidth = 10;
            this.maxAnimateSize = 15;
            this.i = Math.min(i, j);
            this.j = Math.max(i, j);
            this.leftChild = leftChild;
            this.rightChild = rightChild;
            this.width = width;
            this.height = height;
            this.radius = radius;
        }
        knob.prototype.UpdateRadius = function (r) {
            this.previousRadius = this.radius;
            this.animateSize = this.maxAnimateSize;
            this.radius = r;
        };
        knob.prototype.ClickedOn = function (mouseX, mouseY, r2) {
            var xco = this.transformToCanvasX((this.i + this.j) / 16);
            var yco = this.transformToCanvasY(Math.abs(this.i - this.j) / 8);
            var d = Math.pow(mouseX - xco, 2) + Math.pow(mouseY - yco, 2);
            if (d < r2)
                return true;
            else
                return false;
        };
        knob.prototype.UpdateState = function (selecti, selectj, mouseX, mouseY, r2) {
            this.iselected = Math.min(selecti, selectj);
            this.jselected = Math.max(selecti, selectj);
            var selectedState = this.GetSelectionState()[0];
            switch (selectedState) {
                case PieceColor.Selected: {
                    this.pieceSize = Math.min(this.pieceSize + 1, this.maxPieceSize);
                    break;
                }
                case PieceColor.Marginal: {
                    this.pieceSize = Math.min(this.pieceSize + 1, this.maxPieceSize);
                    break;
                }
                case PieceColor.Unselected: {
                    this.pieceSize = Math.max(this.pieceSize - 1, 0);
                    break;
                }
            }
            if (Math.abs(selectj - selecti) >= this.j - this.i) {
                this.thickLeft = (this.iselected == this.i);
                this.thickRight = (this.jselected == this.j);
            }
            else {
                this.thickLeft = false;
                this.thickRight = false;
            }
            var edgeStable = this.adjustEdgeThickness();
            var xco = this.transformToCanvasX((this.i + this.j) / 16);
            var yco = this.transformToCanvasY(Math.abs(this.i - this.j) / 8);
            var d = Math.pow(mouseX - xco, 2) + Math.pow(mouseY - yco, 2);
            this.animateSize = Math.max(this.animateSize - 1, 0);
            this.spinCycle = (this.spinCycle + 2) % 40;
            if (this.animateBounce > 0) {
                this.animateBounce -= 1;
                var t = Math.PI * this.spinCycle / 20;
                var displacement = Math.pow((Math.cos(t) + 1) / 2, 3) - 0.5;
                this.xjitter = 0;
                this.yjitter = displacement * this.animateBounce * 1.5;
            }
            else {
                this.xjitter = 0;
                this.yjitter = 0;
            }
            if (d < r2) {
                this.animateBounce += 2;
                if (this.animateBounce > this.maxBounce)
                    this.animateBounce = this.maxBounce;
                if (this.leftChild != null) {
                    this.jitterChild(true);
                    this.jitterChild(false);
                }
            }
            if (this.animateBounce == 0 && this.xjitter == 0 &&
                this.yjitter == 0 && this.animateSize == 0 &&
                (this.pieceSize == 0 || selectedState != PieceColor.Unselected) &&
                (this.pieceSize == this.maxPieceSize || selectedState == PieceColor.Unselected) &&
                edgeStable) {
                return false;
            }
            else {
                return true;
            }
        };
        knob.prototype.GetCoords = function (staticPosition) {
            var xco = this.transformToCanvasX((this.i + this.j) / 16);
            var yco = this.transformToCanvasY(Math.abs(this.i - this.j) / 8);
            if (staticPosition) {
                return [xco, yco];
            }
            else {
                return [xco + this.xjitter, yco + this.yjitter];
            }
        };
        knob.prototype.GetRadius = function () {
            var interpolate = Math.pow(this.animateSize / this.maxAnimateSize, 2);
            return (this.radius * (1 - interpolate)) + (this.previousRadius * interpolate);
        };
        knob.prototype.GetSelectionState = function () {
            var sizeCorrected = Math.pow(this.pieceSize / this.maxPieceSize, 0.5);
            if (this.i == this.iselected && this.j == this.jselected) {
                return [PieceColor.Selected, sizeCorrected];
            }
            else if (this.i == this.j && (this.i == this.iselected || this.j == this.jselected)) {
                return [PieceColor.Marginal, sizeCorrected];
            }
            else {
                var sizeCorrected2 = Math.pow(this.pieceSize / this.maxPieceSize, 2);
                return [PieceColor.Unselected, sizeCorrected2];
            }
        };
        knob.prototype.GetLines = function () {
            if (this.leftChild != null && this.rightChild != null) {
                var leftxy = this.leftChild.GetCoords(false);
                var rightxy = this.rightChild.GetCoords(false);
                var myxy = this.GetCoords(false);
                return [[myxy, leftxy, this.edgeWidthLeft / this.maxEdgeWidth], [myxy, rightxy, this.edgeWidthRight / this.maxEdgeWidth]];
            }
            else {
                return [];
            }
        };
        knob.prototype.jitterChild = function (left) {
            if (this.leftChild != null && this.rightChild != null) {
                if (left)
                    this.leftChild.jitterChild(left);
                else
                    this.rightChild.jitterChild(left);
            }
            else {
                this.animateBounce += 2;
                if (this.animateBounce > this.maxBounceSmall)
                    this.animateBounce = this.maxBounceSmall;
            }
        };
        knob.prototype.adjustEdgeThickness = function () {
            var stableLeft = false;
            if (this.thickLeft) {
                this.edgeWidthLeft = Math.min(this.edgeWidthLeft + 1, this.maxEdgeWidth);
                if (this.edgeWidthLeft == this.maxEdgeWidth)
                    stableLeft = true;
            }
            else {
                this.edgeWidthLeft = Math.max(this.edgeWidthLeft - 1, 0);
                if (this.edgeWidthLeft == 0)
                    stableLeft = true;
            }
            var stableRight = false;
            if (this.thickRight) {
                this.edgeWidthRight = Math.min(this.edgeWidthRight + 1, this.maxEdgeWidth);
                if (this.edgeWidthRight == this.maxEdgeWidth)
                    stableRight = true;
            }
            else {
                this.edgeWidthRight = Math.max(this.edgeWidthRight - 1, 0);
                if (this.edgeWidthRight == 0)
                    stableRight = true;
            }
            return stableLeft && stableRight;
        };
        knob.prototype.transformToCanvasX = function (x) { return (0.8 * this.width * (x - 0.5)) + this.width / 2; };
        knob.prototype.transformToCanvasY = function (y) { return (-0.5) * (0.8 * this.width * (y - 0.5)) + this.height / 2; };
        return knob;
    }());
    PositionSelector.knob = knob;
    var PieceColor;
    (function (PieceColor) {
        PieceColor[PieceColor["Unselected"] = 0] = "Unselected";
        PieceColor[PieceColor["Selected"] = 1] = "Selected";
        PieceColor[PieceColor["Marginal"] = 2] = "Marginal";
    })(PieceColor = PositionSelector.PieceColor || (PositionSelector.PieceColor = {}));
})(PositionSelector || (PositionSelector = {}));
var PositionSelector;
(function (PositionSelector) {
    var State = (function () {
        function State(canvas, ctx, data, viewer) {
            var _this = this;
            this.pCanvas = canvas;
            this.pCtx = ctx;
            this.pCtx.lineCap = "round";
            this.width = this.pCanvas.width;
            this.height = this.pCanvas.height;
            this.maxrad = this.width / 30;
            this.viewer = viewer;
            this.data = data;
            this.mouseX = 0;
            this.mouseY = 0;
            this.selecti = 0;
            this.selectj = 0;
            this.normalizeViewer = false;
            this.viewer.UpdateGridValues(this.data.GetGrid(this.selecti, this.selectj, this.normalizeViewer), this.data.GetMargin(this.selecti, this.normalizeViewer), this.data.GetMargin(this.selectj, this.normalizeViewer), this.selecti, this.selectj);
            this.knobs = [];
            var knobs = [];
            for (var i = 0; i < 9; i++) {
                var subknobs = [];
                for (var j = 0; j < 9; j++) {
                    subknobs.push(null);
                }
                knobs.push(subknobs);
            }
            for (var gap = 0; gap <= 8; gap++) {
                for (var i = 0; i <= 8 - gap; i++) {
                    var j = i + gap;
                    var knobLeft = (gap == 0) ? null : knobs[i][j - 1];
                    var knobRight = (gap == 0) ? null : knobs[i + 1][j];
                    var newknob = new PositionSelector.knob(i, j, knobLeft, knobRight, this.width, this.height, this.data.GetPositionSpectrum(i, j, true));
                    knobs[i][j] = newknob;
                    this.knobs.push(newknob);
                }
            }
            this.sleeping = false;
            this.pCanvas.addEventListener("mousemove", function (e) { return _this.OnInteraction(e, false); });
            this.pCanvas.addEventListener("mouseleave", function (e) { return _this.OnInteraction(e, false); });
            this.pCanvas.addEventListener("mousedown", function (e) { return _this.OnInteraction(e, true); });
            this.Step();
        }
        State.prototype.UpdateNormalizeViewer = function (normalizeViewer) {
            this.normalizeViewer = normalizeViewer;
            this.viewer.UpdateGridValues(this.data.GetGrid(this.selecti, this.selectj, this.normalizeViewer), this.data.GetMargin(this.selecti, this.normalizeViewer), this.data.GetMargin(this.selectj, this.normalizeViewer), this.selecti, this.selectj);
            if (this.sleeping) {
                this.sleeping = false;
                this.Step();
            }
            return;
        };
        State.prototype.UpdateKnobs = function (data) {
            this.data = data;
            for (var i = 0; i < this.knobs.length; i++) {
                this.knobs[i].UpdateRadius(this.data.GetPositionSpectrum(this.knobs[i].i, this.knobs[i].j, true));
            }
            this.viewer.UpdateGridValues(this.data.GetGrid(this.selecti, this.selectj, this.normalizeViewer), this.data.GetMargin(this.selecti, this.normalizeViewer), this.data.GetMargin(this.selectj, this.normalizeViewer), this.selecti, this.selectj);
            if (this.sleeping) {
                this.sleeping = false;
                this.Step();
            }
            return;
        };
        State.prototype.OnInteraction = function (e, clicked) {
            this.mouseX = e.x - this.pCanvas.getBoundingClientRect().left;
            this.mouseY = e.y - this.pCanvas.getBoundingClientRect().top;
            if (clicked) {
                for (var i = 0; i < this.knobs.length; i++) {
                    if (this.knobs[i].ClickedOn(this.mouseX, this.mouseY, this.maxrad * this.maxrad)) {
                        this.selecti = this.knobs[i].i;
                        this.selectj = this.knobs[i].j;
                    }
                }
                this.viewer.UpdateGridValues(this.data.GetGrid(this.selecti, this.selectj, this.normalizeViewer), this.data.GetMargin(this.selecti, this.normalizeViewer), this.data.GetMargin(this.selectj, this.normalizeViewer), this.selecti, this.selectj);
            }
            if (this.sleeping) {
                this.sleeping = false;
                this.Step();
            }
            return;
        };
        State.prototype.Step = function () {
            var _this = this;
            var updateNeeded = false;
            for (var i = 0; i < this.knobs.length; i++) {
                var updated = this.knobs[i].UpdateState(this.selecti, this.selectj, this.mouseX, this.mouseY, this.maxrad * this.maxrad);
                updateNeeded = updateNeeded || updated;
            }
            this.drawGrid();
            if (updateNeeded) {
                setTimeout(function () { return _this.Step(); }, 16.6);
            }
            else {
                this.sleeping = true;
            }
            return;
        };
        State.prototype.drawGrid = function () {
            this.pCtx.strokeStyle = "#000000";
            this.pCtx.clearRect(0, 0, this.width, this.height);
            for (var i = 0; i < this.knobs.length; i++) {
                var lines = this.knobs[i].GetLines();
                for (var j = 0; j < lines.length; j++) {
                    var xy = lines[j];
                    this.pCtx.lineWidth = xy[2] * 4 + 1;
                    this.lineTo(xy[0][0], xy[0][1], xy[1][0], xy[1][1], this.pCtx);
                }
            }
            this.pCtx.lineWidth = 1;
            for (var i = 0; i < this.knobs.length; i++) {
                if (this.knobs[i].i == this.knobs[i].j) {
                    var xystatic = this.knobs[i].GetCoords(true);
                    this.pCtx.font = "bold 16px sans-serif";
                    this.pCtx.textAlign = "center";
                    this.pCtx.fillText('P' + (this.knobs[i].i + 1), xystatic[0], xystatic[1] + this.maxrad * 2);
                }
                var xy = this.knobs[i].GetCoords(false);
                this.CircleAt(xy[0], xy[1], this.maxrad * this.knobs[i].GetRadius(), this.pCtx);
                var selectionState = this.knobs[i].GetSelectionState();
                if (selectionState[1] > 0) {
                    var r1 = this.maxrad * selectionState[1] * Math.sin(selectionState[1] * Math.PI / 2);
                    var r2 = this.maxrad * selectionState[1] * Math.cos(selectionState[1] * Math.PI / 2);
                    this.pCtx.strokeStyle = (selectionState[0] == PositionSelector.PieceColor.Selected) ? "#FF0000" : "#A00000";
                    this.pCtx.lineWidth = 3;
                    this.lineTo(xy[0] - r1, xy[1] - r2, xy[0] + r1, xy[1] + r2, this.pCtx);
                    this.lineTo(xy[0] - r2, xy[1] + r1, xy[0] + r2, xy[1] - r1, this.pCtx);
                    this.pCtx.lineWidth = 1;
                }
            }
        };
        State.prototype.CircleAt = function (x, y, r, ctx) {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fill();
            return;
        };
        State.prototype.lineTo = function (x1, y1, x2, y2, ctx) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        };
        return State;
    }());
    PositionSelector.State = State;
})(PositionSelector || (PositionSelector = {}));
var Sidebar;
(function (Sidebar_1) {
    var Sidebar = (function () {
        function Sidebar(sidebar, dataSource, positionSelector) {
            var _this = this;
            this.selection = 0;
            this.data = dataSource.map(function (x) { return x[1]; });
            this.positionSelector = positionSelector;
            var _loop_5 = function (i) {
                var data = dataSource[i];
                var div = document.createElement("div");
                var span1 = document.createElement("span");
                var span2 = document.createElement("span");
                div.appendChild(span1);
                div.appendChild(span2);
                span1.innerHTML = data[0];
                span2.innerHTML = " [LOADING]";
                span2.hidden = true;
                if (i % 2 == 0)
                    div.classList.add("sidebar1");
                else
                    div.classList.add("sidebar2");
                div.classList.add("sidebarAll");
                div.classList.add("sidebarUnloaded");
                var index = i;
                var f = function () {
                    _this.activeIndex = index;
                    var data = _this.data[index];
                    if (typeof data === "string") {
                        _this.loadData(data, index, div, span2);
                    }
                    else {
                        _this.update(data, div);
                    }
                };
                div.onclick = f;
                if (i == this_4.selection)
                    f();
                sidebar.appendChild(div);
            };
            var this_4 = this;
            for (var i = 0; i < dataSource.length; i++) {
                _loop_5(i);
            }
        }
        Sidebar.prototype.loadData = function (path, index, div, loadText) {
            if (path === "DUMMY") {
                var data = new DataStore.dummyStore();
                this.updateIndex(index, data, div);
                this.update(data, div);
            }
            else {
                loadText.hidden = false;
                this.requestData(path, index, div, loadText);
            }
        };
        Sidebar.prototype.requestData = function (path, index, div, loadText) {
            var _this = this;
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open('GET', "./models/" + path, true);
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState == 4) {
                    if (xmlhttp.status == 200) {
                        var model = JSON.parse(xmlhttp.responseText);
                        var data = new DataStore.modelStore(model);
                        _this.updateIndex(index, data, div);
                        if (_this.activeIndex == index)
                            _this.update(data, div);
                    }
                    loadText.hidden = true;
                }
            };
            xmlhttp.send();
        };
        Sidebar.prototype.updateIndex = function (index, data, div) {
            this.data[index] = data;
            div.classList.remove("sidebarUnloaded");
            div.classList.add("sidebarLoaded");
        };
        Sidebar.prototype.update = function (data, div) {
            if (this.remove != null)
                this.remove();
            div.classList.add("sidebarSelected");
            this.remove = function () { return div.classList.remove("sidebarSelected"); };
            this.positionSelector.UpdateKnobs(data);
        };
        return Sidebar;
    }());
    Sidebar_1.Sidebar = Sidebar;
})(Sidebar || (Sidebar = {}));
//# sourceMappingURL=out.js.map