var games = new List('games-global-container', {
    item: 'game-info-template',
    valueNames: ['_host', '_players', '_spectators', '_goal', '_status', '_decks', '_likes', '_dislikes',
        {'data': ['gid', 'hp', 'like', 'dislike']}]
});

var createGameDialog = new mdc.dialog.MDCDialog(document.getElementById('createGameDialog'));
createGameDialog.listen('MDCDialog:accept', function () {
    createGame();
});
createGameDialog.listen('MDCDialog:cancel', function () {
    // Do nothing
});

var drawer = new mdc.drawer.MDCTemporaryDrawer(document.getElementById('drawer'));
document.querySelector('.mdc-toolbar__menu-icon').addEventListener('click', function () {
    drawer.open = true
});

window.onload = function () {
    var dgo = JSON.parse(localStorage['dgo']);
    populateDropdown(document.getElementById("scoreLimit"), dgo.sl);
    populateDropdown(document.getElementById("playersLimit"), dgo.pL);
    populateDropdown(document.getElementById("spectatorsLimit"), dgo.vL);
    populateDropdown(document.getElementById("blanksLimit"), dgo.bl);
    populateTimeMultiplier(document.getElementById("timeMultiplier"), dgo.tm);
    loadCardSets(document.getElementById("deck_select"), JSON.parse(localStorage['css']));

    sendPollRequest(false);
    loadGamesList();

    var gid = getURLParameter('gid');
    if (gid !== undefined) {
        postJoinSpectate(gid) // No need to join or spectate, just move the UI there
    }
};

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

function logout() {
    $.post("AjaxServlet?o=lo").always(function (data) {
        window.location = "/";
    });
}

function askPassword() {
    return prompt("Enter the game password:", "");
}

function joinGame(element) {
    var gid = element.getAttribute('data-gid');
    var hp = element.getAttribute('data-hp');

    var password = "";
    if (hp === true) password = askPassword();

    $.post("AjaxServlet?o=jg&gid=" + gid + "&pw=" + password).done(function (data) {
        console.log(data);
        alert("Joined game: " + JSON.stringify(data));
    }).fail(function (data) {
        console.log(data);
        alert("Error data: " + JSON.stringify(data));
    })
}

function spectateGame(element) {
    var gid = element.getAttribute('data-gid');
    var hp = element.getAttribute('data-hp');

    var password = "";
    if (hp === true) password = askPassword();

    $.post("AjaxServlet?o=vg&gid=" + gid + "&pw=" + password).done(function (data) {
        console.log(data);
        alert("Spectating game: " + JSON.stringify(data));
        postJoinSpectate(gid)
    }).fail(function (data) {
        console.log(data);
        alert("Error data: " + JSON.stringify(data));
    })
}

function postJoinSpectate(gid) {
    // TODO: Show game UI
}

function loadGamesList() {
    games.clear();

    // TODO: Show loading now

    $.post("AjaxServlet?o=ggl").done(function (data) {
        console.log(data);
        populateGamesList(data.gl);
    }).fail(function (data) {
        console.log(data);
        alert("Error data: " + JSON.stringify(data));
    })
}

function toggleNoGamesMessage(visible) {
    var container = $('#games-global-container');
    var list = container.find('.list');
    var message = container.find('.message');
    if (visible) {
        list.hide();
        message.show();
    } else {
        list.show();
        message.hide();
    }
}

function filterGames(query) {
    // TODO: Message when there are no search results
    if (query.length === 0) {
        games.filter(); // Remove all filters
    } else {
        games.filter(function (item) {
            return item.values()._host.indexOf(query) !== -1;
        })
    }
}

function populateGamesList(gamesList) {
    var items = [];
    for (var i = 0; i < gamesList.length; i++) {
        var game = gamesList[i];

        var status;
        if (game.S === "l") status = "lobby";
        else status = "started";

        var decksNames = deckIdsToNames(game.go.css);
        var decks;
        if (decksNames.length === 0) decks = "none";
        else decks = decksNames.join(", ");

        var players;
        if (game.P.length === 0) players = "none";
        else players = game.P.join(", ");

        players += " (" + game.P.length + "/" + game.go.pL + ")";

        var spectators;
        if (game.V.length === 0) spectators = "none";
        else spectators = game.V.join(", ");

        spectators += " (" + game.V.length + "/" + game.go.vL + ")";

        items.push({
            "gid": game.gid,
            "hp": game.hp,
            "_likes": game.LK,
            "_dislikes": game.DLK,
            "like": game.iLK,
            "dislike": game.iDLK,
            "_host": game.H,
            "_decks": decks,
            "_players": players,
            "_spectators": spectators,
            "_goal": game.go.sl,
            "_status": status
        });
    }

    games.clear();
    games.add(items, function (items) {
        for (var i = 0; i < items.length; i++) {
            var gid = items[i].values().gid;
            var card = $(items[i].elm);

            var likeButton = card.find('button:has(i:contains("up"))');
            if (card.attr("data-like") === "true") likeButton.addClass('mdl-button--raised');
            else likeButton.removeClass('mdl-button--raised');

            var dislikeButton = card.find('button:has(i:contains("down"))');
            if (card.attr("data-dislike") === "true") dislikeButton.addClass('mdl-button--raised');
            else dislikeButton.removeClass('mdl-button--raised');

            likeButton.attr("id", "like_" + gid);
            dislikeButton.attr("id", "dislike_" + gid);

            card.find('._likes').attr("data-mdl-for", "like_" + gid);
            card.find('._dislikes').attr("data-mdl-for", "dislike_" + gid);
        }
    });

    toggleNoGamesMessage(games.size() === 0);
}

function deckIdsToNames(ids) {
    var names = [];
    var css = localStorage["css"];
    if (css === undefined) return ids; // Shouldn't happen
    var json = JSON.parse(css);

    for (var i = 0; i < ids.length; i++) {
        for (var j = 0; j < json.length; j++) {
            if (ids[i] === json[j].cid) names[i] = json[j].csn;
        }
    }

    return names;
}

function showCreateGameDialog() {
    createGameDialog.show();
}

function createGame() {
    $.post("AjaxServlet?o=cg").done(function (data) {
        postJoinSpectate(data.gid);
        loadGamesList();
    }).fail(function (data) {
        console.log(data);
        alert("Error create game: " + JSON.stringify(data));
    });
}

function updateLikeDislike(likeButton, disLikeButton, data) {
    if (likeButton === undefined) {
        likeButton = $(disLikeButton.parentElement).find('button[id^=like_]');
        disLikeButton = $(disLikeButton);
    } else if (disLikeButton === undefined) {
        disLikeButton = $(likeButton.parentElement).find('button[id^=dislike_]');
        likeButton = $(likeButton);
    } else {
        return;
    }

    if (data.iLK) likeButton.addClass('mdl-button--raised');
    else likeButton.removeClass('mdl-button--raised');

    if (data.iDLK) disLikeButton.addClass('mdl-button--raised');
    else disLikeButton.removeClass('mdl-button--raised');
}

function likeGame(button) {
    var gid = button.parentElement.parentElement.getAttribute('data-gid');

    $.post("AjaxServlet?o=lk&gid=" + gid).done(function (data) {
        updateLikeDislike(button, undefined, data);
        console.log(data);
    }).fail(function (data) {
        console.log(data);
    });
}

function dislikeGame(button) {
    var gid = button.parentElement.parentElement.getAttribute('data-gid');

    $.post("AjaxServlet?o=dlk&gid=" + gid).done(function (data) {
        updateLikeDislike(undefined, button, data);
        console.log(data);
    }).fail(function (data) {
        console.log(data);
    });
}
