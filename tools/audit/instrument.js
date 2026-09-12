(function() {
    console.log("[Instrument] WebGL Instrumentation initialized.");
    
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, options) {
        const ctx = origGetContext.apply(this, arguments);
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
            console.log(`[Instrument] WebGL Context created: ${type}`);
            if (!ctx) return ctx;
            
            // Hook getExtension
            const origGetExt = ctx.getExtension;
            ctx.getExtension = function(name) {
                console.log(`[Instrument] getExtension called: ${name}`);
                return origGetExt.apply(this, arguments);
            };

            // Hook useProgram
            const origUseProgram = ctx.useProgram;
            ctx.useProgram = function(program) {
                if (program && !program.__instrumented) {
                    program.__instrumented = true;
                    // Could log shader here if we hooked shader compilation
                }
                return origUseProgram.apply(this, arguments);
            };
            
            // Hook shader compilation to steal source
            const origShaderSource = ctx.shaderSource;
            ctx.shaderSource = function(shader, source) {
                if (source.includes("main") && (source.includes("gl_FragColor") || source.includes("fragColor") || source.includes("gl_Position"))) {
                    let typeStr = source.includes("gl_Position") ? "VERTEX" : "FRAGMENT";
                    console.log(`[Instrument] SHADER_SOURCE_${typeStr}_START`);
                    console.log(source.substring(0, 500) + "...[TRUNCATED]"); // keep logs clean
                    console.log(`[Instrument] SHADER_SOURCE_${typeStr}_END`);
                }
                return origShaderSource.apply(this, arguments);
            };
            
            // Hook draw calls
            let drawCallCount = 0;
            const origDrawElements = ctx.drawElements;
            ctx.drawElements = function(mode, count, type, offset) {
                drawCallCount++;
                return origDrawElements.apply(this, arguments);
            };
            const origDrawArrays = ctx.drawArrays;
            ctx.drawArrays = function(mode, first, count) {
                drawCallCount++;
                return origDrawArrays.apply(this, arguments);
            };

            // Hook rAF to report frame metrics
            let lastTime = performance.now();
            let frames = 0;
            const origRAF = window.requestAnimationFrame;
            window.requestAnimationFrame = function(cb) {
                return origRAF(function(time) {
                    frames++;
                    if (time - lastTime >= 1000) {
                        console.log(`[Instrument] FPS: ${frames} | DrawCalls: ${drawCallCount}`);
                        frames = 0;
                        drawCallCount = 0;
                        lastTime = time;
                    }
                    cb(time);
                });
            };
        }
        return ctx;
    };
})();
