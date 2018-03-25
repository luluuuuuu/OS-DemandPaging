
(function (window) {
    var document = window.document;

    // 获取“开始”按钮
    var startBtn = document.getElementById("startBtn");

    function Console(consoleID) {
        this.consoleMain = document.getElementById(consoleID);

        Console.prototype.log = function (string) {
            this.consoleMain.value += (string + "\n");
        };

        Console.prototype.clear = function () {
            this.consoleMain.value = "";
        };

    };

    // 初始化控制台
    var console = new Console("console");

    var numberOfTotalMemoryBlocks = parseInt(document.getElementById("numberOfTotalMemoryBlocks").textContent); // 4
    var numberOfTotalInstructions = parseInt(document.getElementById("numberOfTotalInstructions").textContent); // 320
    var numberOfInstructionsInEachPage = parseInt(document.getElementById("numberOfInstructionsInEachPage").textContent); // 10

    // 需要改变的标签元素
    var currentInstructionSpan = document.getElementById("currentInstruction");
    var numberOfMissingPagesSpan = document.getElementById("numberOfMissingPages");
    var pageFaultRateSpan = document.getElementById("pageFaultRate");

    // 内存
    var memory = [];
    // 记录指令是否被执行
    var instructions = [];
    // 记录执行的指令个数
    var insCount = 0;
    // 缺页个数
    var missingPage = 0;

    function isInstructionExecuted(number) {
        if (typeof instructions[number] === "undefined") {
            instructions[number] = false;
        };
        return instructions[number];
    };

    function isInstructionAvailable(number) {
        for (var i = 0; i < memory.length; i++) {
            if (Math.floor(number / numberOfInstructionsInEachPage) === memory[i]) {
                // 已经存在，没有发生缺页
                console.log("指令" + number + "在内存的块" + i + "中\n");
                return true;
            };
        };
        // 缺页
        console.log("发生缺页，指令" + number + "不在内存中");
        return false;
    };

    function init() {
        memory = new Array(numberOfTotalMemoryBlocks);
        instructions = new Array(numberOfTotalInstructions);
        insCount = 0;
        missingPage = 0;

        currentInstructionSpan.textContent = -1;
        numberOfMissingPagesSpan.textContent = missingPage;
        pageFaultRateSpan.textContent = missingPage / 320;
    };

    function initMemory() {
        console.log("<初始化内存块>");
        var i = 0;
        for (var i = 0; i < memory.length; i++) {
            var page = Math.floor(Math.random() * (numberOfTotalInstructions / numberOfInstructionsInEachPage));
            var offset = Math.floor(Math.random() * numberOfInstructionsInEachPage);
            var instruct = page * numberOfInstructionsInEachPage + offset;

            // 将指令所在的页调入内存
            console.log("将指令" + instruct + "所在的页调入内存空白块" + i);
            memory[i] = page;
        };
        console.log("<初始化结束>\n");
    };

    function FIFO() {
        console.log("使用FIFO算法");

        // 选择指令的策略
        //  0 : 顺序执行
        //  1 : 向后跳转
        // -1 : 向前跳转
        var strategy = 1;
        var po = 0;
        var instruct = -1;
        
        while(insCount < 320) {
            // 选择运行的指令
            if (strategy === 0) {
                // 顺序执行
                instruct++;

                // 更新策略
                if (insCount % 4 === 1) {
                    // 向前跳转
                    strategy = -1;
                } else if (insCount % 4 === 3) {
                    // 向后跳转
                    strategy = 1;
                };
            } else if (strategy === 1) {
                // 向后跳转
                if (instruct + 1 > 319) {
                    strategy = -1;
                    continue;
                };

                instruct = Math.floor(Math.random() * (numberOfTotalInstructions - (instruct + 1)) + (instruct + 1));

                // 更新策略
                // 顺序执行
                strategy = 0;
            } else if (strategy === -1) {
                // 向前跳转
                if (instruct - 2 < 0) {
                    strategy = 1;
                    continue;
                };

                instruct = Math.floor(Math.random() * (instruct - 1));

                // 更新策略
                // 顺序执行
                strategy = 0;
            };

            // 处理越界
            if (instruct < 0) {
                // 向下越界
                instruct = -1;
                
                // 更新策略
                // 向后跳转
                strategy = 1;

                continue;
            } else if (instruct >= 320) {
                // 向上越界
                instruct = 321
                
                // 更新策略
                // 向前跳转
                strategy = -1;

                continue;
            };

            // 判断选中的指令是否被运行过
            if (!isInstructionExecuted(instruct)) {
                // 当前指令没有被运行过
                // 更新相应html标签
                currentInstructionSpan.textContent = instruct;
                
                // 判断选中指令是否在内存中
                if (!isInstructionAvailable(instruct)) {
                    // 不在内存中，缺页
                    missingPage++;
                    // 更新相应html标签
                    numberOfMissingPagesSpan.textContent = missingPage;
                    pageFaultRateSpan.textContent = missingPage / 320;

                    // 替换 - FIFO
                    console.log("将指令" + instruct + "所在的页调入内存，替换块" + po % 4 + '\n');
                    document.getElementById('block' + po%4).textContent = '指令'+instruct;
                    memory[(po++) % 4] = Math.floor(instruct / numberOfInstructionsInEachPage);
                };
                insCount++;
                instructions[instruct] = true;
            };
        };
    };

    function LRU() {
        console.log("使用LRU算法");

        // 选择指令的策略
        //  0 - 顺序执行
        //  1 - 向后跳转
        // -1 - 向前跳转
        var strategy = 1;

        // 访问顺序，靠近末尾的为最近访问的
        var stack = [0, 1, 2, 3];

        var instruct = -1;
        while(insCount < 320) {
            // 选择运行的指令
            if (strategy === 0) {
                // 顺序执行
                instruct++;

                // 更新策略
                if (insCount % 4 === 1) {
                    // 向前跳转
                    strategy = -1;
                } else if (insCount % 4 === 3) {
                    // 向后跳转
                    strategy = 1;
                };
            } else if (strategy === 1) {
                // 向后跳转
                if (instruct + 1 > 319) {
                    strategy = -1;
                    continue;
                };

                instruct = Math.floor(Math.random() * (numberOfTotalInstructions - (instruct + 1)) + (instruct + 1));

                // 更新策略
                // 顺序执行
                strategy = 0;
            } else if (strategy === -1) {
                // 向前跳转
                if (instruct - 2 < 0) {
                    strategy = 1;
                    continue;
                };

                instruct = Math.floor(Math.random() * (instruct - 1));

                // 更新策略
                // 顺序执行
                strategy = 0;
            };

            // 处理越界
            if (instruct < 0) {
                // 向下越界
                instruct = -1;
                
                // 更新策略
                // 向后跳转
                strategy = 1;

                continue;
            } else if (instruct >= 320) {
                // 向上越界
                instruct = 321
                
                // 更新策略
                // 向前跳转
                strategy = -1;

                continue;
            };

            // 判断选中的指令是否被运行过
            if (!isInstructionExecuted(instruct)) {
                // 当前指令没有被运行过
                // 更新相应html标签
                currentInstructionSpan.textContent = instruct;
                
                // 判断选中指令是否在内存中
                if (!isInstructionAvailable(instruct)) {
                    // 不在内存中，缺页
                    missingPage++;
                    // 更新相应html标签
                    numberOfMissingPagesSpan.textContent = missingPage;
                    pageFaultRateSpan.textContent = missingPage / 320;

                    // 替换
                    console.log("将指令" + instruct + "所在的页调入内存，替换块" + stack[0]);
                    document.getElementById('block' + stack[0]).textContent = '指令'+instruct;
                    memory[stack[0]] = Math.floor(instruct / numberOfInstructionsInEachPage);
                };

                // 更新访问顺序
                var page = Math.floor(instruct / numberOfInstructionsInEachPage);
                var block = memory.indexOf(page);

                // 将当前块在访问顺序数组中挪到最后一位
                stack.splice(stack.indexOf(block), 1);
                stack.push(block);

                insCount++;
                instructions[instruct] = true;
            };
        };
    };

    function chooseAlgorithm() {
        var ratio = document.querySelector("input:checked");
        if (ratio.value === "FIFO") {
            FIFO();
        } else if(ratio.value === "LRU") {
            LRU();
        };
    };

    function start() {
        // 禁用“开始”按钮
        startBtn.disabled = true;

        // 初始化变量
        init();

        //清空控制台
        console.clear();

        // 输出开始信息
        console.log("<开始模拟>")

        // 初始化内存
        initMemory();

        // Choose algrithm and start
        chooseAlgorithm();

        // 输出结束信息
        console.log("<模拟结束>");
        console.log("----------------");

        // 输出结果
        console.log("缺页率为：" + missingPage + "/320");

        // 启用“开始”按钮
        startBtn.disabled = false;
    }

    // Add event listener for start btn
    startBtn.addEventListener('click', start);
})(window)


