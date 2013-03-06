$(document).ready( function() {

    var Minesweeper = function() {};
    Minesweeper.prototype = $.fn.minesweeper.gameEngine;

    function getFixture() {
        return new Minesweeper();
    }

    test("distributeMines", function() {

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

    test("getCellId", function() {
        var ms = getFixture();
        equal(ms.getCellId(2,10), '2-10');
        equal(ms.getCellId(20,10), '20-10');
        equal(ms.getCellId(0,10), '0-10');
    });

});