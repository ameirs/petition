let hedgehog = $("#main-container");

let homeTitle = $("#home-title");

hedgehog.on("click", function (e) {
    homeTitle.css("visibility", "visible");
});
    $(".nav").hide();
    $(".menu-btn").click(function () {
        $(".nav").toggle(300); // expands menu
    });
    $(".sub-menu").hide();
    $(".nav li.expand").click(function () {
        $(".sub-menu").toggle(300); // shows sub-menu
    });

$(document).on("mousemove", function(e) {
    homeTitle.css("transform", "translateY(5%)")
    setTimeout(() => {
        homeTitle.css("transform", "translateY(-100%)")
        $(document).off("mousemove")
        $(".infobox").css("transform", "translateY(0)");
    }, 3000);
})
$("#about").on("click", function(e){
    $(".about").css("transform", "translateY(0)");
})
$("#close-button").on("click", function (e) {
    console.log("I am triggered");
    $(".about").css("transform", "translateY(150%)");
});

let inputSignature = $("#inputSignature");
let canvas = $("#canvSignature");
let blankCanvas = $("#blankCanvas");
let submitButton = $("#submitButton");

let ctx = canvas[0].getContext("2d");
ctx.strokeStyle = "#222222";
ctx.lineWidth = 1;

let dataUrl;

submitButton.on("click", function (event) {
    inputSignature.val(dataUrl);
});

canvas.on("mousedown", function (e) {
    let startpos = {
        x: e.clientX - canvas.offset().left,
        y: e.clientY - canvas.offset().top,
    };

    ctx.beginPath(startpos.x, startpos.y);
    canvas.on("mousemove", function (e) {
        let movpos = {
            x: e.clientX - canvas.offset().left,
            y: e.clientY - canvas.offset().top,
        };

        ctx.lineTo(movpos.x, movpos.y);
        ctx.stroke();
    });
});

$(document).on("mouseup", function () {
    canvas.off("mousemove");
    const isBlank = canvas[0].toDataURL() === blankCanvas[0].toDataURL();
    if (isBlank) {
        dataUrl = undefined;
    } else {
        dataUrl = canvas[0].toDataURL();
    }
    console.log(dataUrl);
});







