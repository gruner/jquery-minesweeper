$(document).ready( function() {

    var Minesweeper = function() {};
    Minesweeper.prototype = $.fn.minesweeper.gameEngine;

    function getFixture() {
        var ms = new Minesweeper();
        // ms.init($this, o.mineCount, o.rowCount, o.columnCount, o.theme);
        // ms.run();

        return ms;
    }

    test("distribute mines", function() {

        var ms = getFixture(),
            mineCount = 40,
            result = ms.distributeMines(mineCount, 20, 20),
            resultCount = 0
            ;

        for (var key in result) {
            if (result[key].length) {resultCount += result[key].length;}
        }

        ok(result);

        equal(resultCount, mineCount);
    });

});