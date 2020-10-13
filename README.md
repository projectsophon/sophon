# sophon

The Dark Forest Toolbox

## Secrets to Dark Forest (v0.4)

Brought to you by Rank 1 and 2 players, @jacobrosenthal and @phated.

There are no secrets, it was hard work and more than a full time job for a week+ for both of us.

### Create your game

You have to inspect the source code and make the game while you play it to find an edge over the person who is just using what they gave us.

For this round, Blaine was lead client dev, both playing and developing at the same time. While, Jacob would find the features missing or things slowing him down, and create the algorithms to fix it.

We improved the development time significantly over the default client by using an experimental build tool, called Vite. Even with that benefit, refresh times got brutal to the point would batch changes and do a single client refresh. Ideally, our client would have had working hot module reloading (HMR) to avoid full reloads.

### Before your key

This round required a whitelist key to play; however, there were some things you could do to take an advantage once you got one!

You can pick your x,y coordinates to start :) You still have to land on a lvl 0 planet in a Nebula. We used this technique, but didn't have a good understanding of the map, so sadly we picked the east side of the map with tons of Nebula. The other half had like 10 lvl 5 and above planets, and we were behind for several days.

To find our starting coordinates, we started exploring the map before playing the game. This doesn't require a whitelist key at all and can give you a significant advantage, even if you join days after the first few players. You could pick a nice spot on the edge of the universe and snag some big planets quickly!

However, the game is definately a plutocracy, so the people that start exploring the map right away can expand in the most directions towards the radius and bigger planets.

### Resources

Information is even MORE key this round. You need the 10 planets with the most Energy possible, everything else is worth very little. That means lvl 5/6/7 planets (with double energy bonus, if you can find them).

Energy doubling is crazy! A doubled Energy lvl 5 is worth more points than a 7, and they are just as, or more, plentiful. We built a report view JUST to look for overlooked doubled Energy planets.

Jacob ended up with one doubled 7, two doubled 6s, three doubled 5s in his top 10, while Blaine had four double 5s!

If information is still the main resource, then exploring is still the most important thing. You can pay to put your explorer on a powerful server, and you probably should.

### Exploring

Most importantly for us, Jacob found a 10x speedup in the Rust explorer DF Team promoted a week before the game start. With it, we achieved 1-2k hashes on a Raspberry Pi and 3-5k on a our laptops. But running a 24cpu server on Digital Ocean pulled ~28k hashes when benchmarked it. We are cheap, so we only ran it for 24 hours after we reached top 2 -- but it was awesome!

You can explore outside the legal radius, just comment out the radius check. During periods of low expansion during the start of the game, get a head start on the next place you want to expand towards!

Exploring strategy is very important. Not all squares are equal. You want that sweet deep space only. We used Spiral Skip (community calls it swiss cheese) explorer for a while to find deep space edges, but through converstion with DF Team we realized you can comment out a check in the client and know if your mouse is over deep space even for areas you can't see!

As soon as we realized that temperature was cheaply available we made a "deep space only" explorer that was probably the biggest game changer. Once the radius expands there is increasingly more map to explore while our hash power stays the same. That leveled us up again.

### Upgrades

Defense upgrades means you don't need to keep your empire together. Don't be attached to your planets.

In fact, attacking is such a bad idea, you could almost let people waste their time taking your planets only slightly confounding them to keep your reputation up. It will take them a day to take planets that you don't even care about anymore as most likely you're already developing the new 5/6/7s you're finding. The world is expanding. Expand with it.

### Lightspeed

The way to get across the map is to use lvl 4 planets with doubled Range. They're very plentiful and start off going double distance without any upgrades wasted.

Then, do a 100% jump as far as you can, while landing on an asteroid. Asteroids have halved defense, which doubles your landing energy again! If you do commit to upgrading Range, a lowly lvl 4 planet can jump >5 hours away with maxed Range.

### Customize

Again, develop the client you want to play -- there is a ton of information to keep track of. We merged all planet and upgrade panels into one context pane, and we  added a planet dex as a "command & control" interface to quick monitor all planet Energy/Silver/Upgrades and click to jump to them.

Automation is key. Near the end, we added a "distribute" button which uses all but 35% of every Astroid's Energy to send 100% of silver to nearby planets in need from nearest to farthest. We combined that with an "auto capture" button that grabs nearby unowned planets at a given level. Those, along with an "auto upgrade" button, allowed us to click capture -> distribute -> upgrade and our empire managed itself by the end of the game.

### Thanks!

Thank you to the DF Team for making a great game, chatting with us, and being excited about our projects! We are excited to see how everything continues to shape out. Also, thanks to the community who have been awesomely energetic all week!

I hope you bought hats. The secret was hats.

## Project info

### Install

* Install Node
* Install Yarn
* Install Rust

### Using

Install dependencies by running `yarn`, this will also kick off the first Rust build.

Once all that succeeds, use `yarn start`, which will ask you a series of questions about how to configure your explorer!

### Static game client

You can try out just the game client by running `yarn static:build` followed by `yarn static:serve`.

### Project Structure

* `/client` contains the modified game client (based on [darkforest-eth/client](https://github.com/darkforest-eth/client))
* `/native` contains all the Rust code that we generate native bindings from.
* `/lib` contains the JS code that manages the SpiralPattern, Perlin, etc.
* `/index.mjs` is the primary file that creates a leveldb instance (to stores all explored chunks), a websocket server for communicating to a client, and a file server for the game client.

### Rebuilding

If you change any **Rust** or **Reason** code, you need to run `yarn build` for the native bindings to be regenerated.

If you are continuously working on Reason code, you can run the build in watch mode by running `yarn re:watch`.

### "Known Board"

Any chunks explored by Sophon will be stored in a leveldb instance at `known_board_perlin`. If something gets out-of-sync, you can delete that directory to start from scratch.
