// some generics and promise
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
              ? args[number]
              : match
            ;
        });
    };
}
function get(url) {
    // Return a new promise.
    return new Promise(function (resolve, reject) {
        // Do the usual XHR stuff
        var req = new XMLHttpRequest();
        req.open('GET', url);

        req.onload = function () {
            // This is called even on 404 etc
            // so check the status
            if (req.status == 200) {
                // Resolve the promise with the response text
                resolve(req.response);
            }
            else {
                // Otherwise reject with the status text
                // which will hopefully be a meaningful error
                reject(Error(req.statusText));
            }
        };

        // Handle network errors
        req.onerror = function () {
            reject(Error("Network Error"));
        };

        // Make the request
        req.send();
    });
}


//main
function App() {
    //vars
    self = this;
    self.CoreAPI = "https://playdraft.herokuapp.com/api/";
    //images assets
    self.nba = "nba-logo.png";
    self.nfl = "nfl-logo-National-Football-League.png";
    self.nhl = "NHL_Logo_former.png";
    self.mlb = "mlb_logo_blog1.gif";
    //api v1
    self.DraftVersion = "v1/";
    //computed
    self.APIPath = function (EndPoint) {
        return self.CoreAPI + self.DraftVersion + EndPoint;
    }
    //genric for enum
    self.menuOption = [
               "NFL",
               "NHL",
               "NBA",
                "MLB"
    ];
    self.leagueList = []; //only the players per league
    self.playerList = []; //all player across leagues

    // checks the age of the player and returns a string
    self.ageDector = function (age, def, player)
    {
        var howOld = Math.abs(def);
        if (def === 0) {
           return "{0} is the average age. ".format(player);
        }
        if (def < 0) {
            return "{0} is {1} years younger then his average teammates. ".format(player, howOld);
        } else {
            return "{0} is {1} years older then his average teammates. ".format(player, howOld);
        }
    }


    //genric for coverting basket player position to strings
    self.basketCovert = function (pos)
    {
        switch (pos) {
            case "G":
                return "Guard";
            case "PG":
                return "Point Guard";
            case "SG":
                return "Shooting Guard";
            case "C":
                return "Center";
            case "PF":
                return "Power Forward";
            case "F":
                return "Forward";
            case "SF":
                return "Small Forward";
        }
    }

    //generic for returning the logo image
    self.SetLeagueLogo = function(league)
    {
        switch (league) {
            case "NBA":
                return self.nba;
            case "NFL":
                return self.nfl
            case "MLB":
                return self.mlb;
            case "NHL":
                return self.nhl;
        }
    };

    // Search the DOM and find matches, this can be refactor into a frameworks bulit sorting large data sets, in like d3.js or angular
    self.CustomSearch = function (DOMElements, searchTerm)
    {
        $(DOMElements).each(function (index, dom)
        {
            var search = $(dom).attr("data-player-search");
            var league = $(dom).attr("data-player-league");
            var str = search.toLowerCase(),
            search = searchTerm.toLowerCase(),
            isInString = !(str.indexOf(search) == -1);
            //match on partials otherwise hide the 
            if (!isInString) {
                $(dom).hide();
            } 
        });
    };


    self.RenderPlayer = function (id, index)
    {
        var playerAPI = self.APIPath("players/{0}".format(id));
        get(playerAPI).then(function (playerDetails) { 
            return JSON.parse(playerDetails);
        }).then(function (playerDetails) {

            playerDetails.player.leagueLogo = self.SetLeagueLogo(playerDetails.player.league);
            playerDetails.player.ageStatus = self.ageDector(playerDetails.player.age, playerDetails.player.average_position_age_diff, playerDetails.player.name_brief);

            if (playerDetails.player.league === "NBA")
            playerDetails.player.position = self.basketCovert(playerDetails.player.position);
            
            $('#PlayerContent').html(tmpl("tmpl-player", playerDetails.player));
            $('#PlayerView').modal('toggle');
        });
    };

    self.RenderLeague = function (playerList, league)
    {
        var frame = {
            genericProfile: "player_generic.png",
            NA: "Not Available",
            records: playerList.length,
            menuoption: self.menuOption,
            playerList: playerList,
            controller: self,
            league: league
        };

       
        var htmlTemplate = tmpl("tmpl-frame", frame);
       
        $("#app").append(htmlTemplate);
       
            $("#loading{0}".format(league)).hide();
            $("#gallery{0}".format(league)).show('slow');
    };

    self.getPlayerList = function (players)
    {
        var localList = [];
        self.leagueList = [];
        $.each(players, function (index, player) {
            localList.push(player);
            self.playerList.push(player);
        });
        return localList;
    };

    self.initialize = function ()
    {
       
        var cache = localStorage.getItem("playerCache");
     
        //if (!cache) {
            $.each(self.menuOption, function (index, league) {
                get(self.APIPath("players?league={0}".format(league))).then(function (response) {
                    return JSON.parse(response);
                }).then(function (response) {

                    self.leagueList =  self.getPlayerList(response.players);
                    //render each response seperate so it doesn't block the others
                    self.RenderLeague(self.leagueList, league);
                  
                });
            });
    };
}

//one off for the inline event to fire since we using jquery to inject DOM elements they aren't register with the DOM model so they aren't triggered.
function loadThis(element)
{
    app.RenderPlayer($(element).attr("data-player-id"));
}

//setup the search filter on change
function listFilter()
{
    $("#SearchPlayerText")
      .change(function () {
          var search = $(this).val();
          //wait for atleast 3 chars
          if (search.length > 3) {
              app.CustomSearch($(".nav-item"), search);
          } else if (search.length === 0) {
              $(".nav-item").show();
          }
          return false;
      })
    .keyup(function () {
        // fire the above change event after every letter
        $(this).change();
    }, 500);
}

var app = new App();
app.initialize();

$(document).ready(function ()
{
    listFilter();
});
