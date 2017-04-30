#!/usr/bin/env python
from lxml import html
import json, re, os, sys
import requests
import datetime, time

import pprint

MOVIES = "https://in.bookmyshow.com/kolkata/movies" # Region URL of movies
PLAYS = "https://in.bookmyshow.com/kolkata/plays"   # Region URL of plays
MOVIE_VENUES = {"INQT": "Quest Mall", "INSC": "South City", "INER":"Forum"} # Map of BookMyShow venue codes - TODO: Get this automatically
PLAY_VENUES = ['Gyan Manch', 'Kala Mandir', 'Birla Sabhagar', 'Kolkata']
LANGUAGES = ['English', 'Hindi', 'Bilingual']
SHOWTIME_HOUR = 18  # Only show showtimes after this hour - set to 0 to show everything
PLAY_ADVANCE_DAYS = 20  # Show plays happening upto this many days later

def download_movies():
    global MOVIES
    page = requests.get(MOVIES)
    tree = html.fromstring(page.content)
    c_movies = tree.xpath('//*[@id="now-showing"]/section[2]/div/aside[1]/div/ul/li/a[@class="__name"]/text()');
    c_movie_links = tree.xpath('//*[@id="now-showing"]/section[2]/div/aside[1]/div/ul/li/a[@class="__name"]/@href');
    
    movies = []
    #filter this list to remove any which are not english
    for i, movie in enumerate(c_movies):
        languages = tree.xpath('//*[@id="now-showing"]/section[1]/div/div[2]/div[2]/div/div/div/div[3]/div[1]/a[text()="' + movie + '"]/../../div[@class="languages"]/ul/li/text()')
        #pprint.pprint(languages)
        #pprint.pprint(c_movie_links[i])
        
        languages = [x.replace(", ", "") for x in languages];
        
        global LANGUAGES
        for x in LANGUAGES:
            if x in languages:
                movies.append({'title':movie, 'href':c_movie_links[i], 'code':c_movie_links[i].split('/')[-1], 'shows':{}})
                break
                
    # now go to the movie page and get the showtimes from Quest, SouthCity and Forum [post 7pm]
    
    for movie in movies:
        url = "https://in.bookmyshow.com" + movie['href']
        
        page = requests.get(url)
        tree = html.fromstring(page.content)
        
        movie['synopsis'] = tree.xpath('//html/head/meta[@property="og:description"]/@content')[0];
        movie['poster_path'] = "https:" + tree.xpath('//img[@id="poster"]/@data-src')[0];
        movie['genres'] = tree.xpath('//span[@itemprop="genre"]/@content')
        movie['duration'] = tree.xpath('//span[@itemprop="duration"]/text()')
        movie['rating'] = tree.xpath('//div[@class="heart-rating"]/span[@class="__percentage"]/text()')
        
        global MOVIE_VENUES
        venues = MOVIE_VENUES
        
        global SHOWTIME_HOUR
        if (datetime.datetime.now().time().hour > SHOWTIME_HOUR):
            # If its already after the showtime hour, show data for tomorrow
            dc = (datetime.date.today() + datetime.timedelta(days=1)).strftime('%Y%m%d')
        else:    
            dc = datetime.datetime.today().strftime('%Y%m%d')
            
        for v, venue in venues.items():
            p = requests.get("https://in.bookmyshow.com/serv/getData/?cmd=GETSHOWTIMESBYEVENTANDVENUE&f=json&dc=" + dc + "&vc=" + v + "&ec=" + movie['code'])
            showtimes = json.loads(p.content)
            
            #print movie['title'], movie['code'], v, "---", venue
            #pprint.pprint(showtimes)
            
            movie['shows'][venue] = []
            
            showtimes = showtimes['BookMyShow']['arrShows']
            for show in showtimes:
                if ((int(show['ShowTimeNumeric']) < (SHOWTIME_HOUR * 100)) and datetime.datetime.now().isoweekday() in range(1, 6)):
                    continue
                if (show['Availability'] != "Y"):
                    continue
                if datetime.datetime.strptime(show['CutOffDateTime'], "%Y-%m-%d %H:%M:%S") < datetime.datetime.now():
                    continue
                movie['shows'][venue].append(show['ShowTimeDisplay'])
            if (len(movie['shows'][venue]) == 0):
                del movie['shows'][venue]
    
    # Remove those movies which don't have any showtimes
    movies = [x for x in movies if len(x['shows']) > 0]
            
    return movies

def download_plays():
    global PLAYS
    page = requests.get(PLAYS)
    tree = html.fromstring(page.content)
    play_names = tree.xpath('//aside[@data-selector="plays"]/div[1]/div[2]/div[1]/a/text()');
    play_poster = tree.xpath('//aside[@data-selector="plays"]/div[1]/div[1]/img/@data-mobile');
    play_links = tree.xpath('//aside[@data-selector="plays"]/div[1]/div[2]/div[1]/a/@href');
    
    c_plays = tree.xpath('//aside[@data-selector="plays"]');
    plays = []
    
    for i, play in enumerate(c_plays):
        genres = [x for x in play.get('data-genre-filter').split("|") if x not in ['plays', 'Plays', 'genremeta', '']]
        language = re.sub('<[^<]+?>', '', play.get('data-language-filter'))
        datecode = [x for x in play.get('data-datecode-filter').split("|") if x != ""]
        location = play.get('data-location-filter')
        
        global PLAY_VENUES
        venues = [x for x in PLAY_VENUES if location.find(x) > -1]
        if len(venues) == 0:
            continue
        
        global LANGUAGES
        languages = [x for x in LANGUAGES if language.find(x) > -1]
        if len(languages) == 0:
            continue
        
        global PLAY_ADVANCE_DAYS
        cutoff = (datetime.datetime.today() + datetime.timedelta(days=PLAY_ADVANCE_DAYS))
        datecode = [datetime.datetime.strptime(x, '%Y%m%d').strftime('%b %d') for x in datecode if x != "" and datetime.datetime.strptime(x, '%Y%m%d') <= cutoff and datetime.datetime.strptime(x, '%Y%m%d') >= datetime.datetime.today()]
        if (len(datecode) == 0):
            continue
        
        detail_url = "https://in.bookmyshow.com" + play_links[i]
        
        page = requests.get(detail_url)
        tree = html.fromstring(page.content)
        synopsis = [x.replace("\t", "").replace("\n", "") for x in tree.xpath('//div[@class="synopsis"]/text()')]
        if (len(synopsis) > 0):
            synopsis = synopsis[0]
        else:
            synopsis = ""
            
        duration = tree.xpath('//div[@class="tags"]/span[contains(text(), "min")]/text()')
        
        plays.append({'title':play_names[i], 'genres':genres, 'language':language, 'dates':datecode, 'location':location, 'poster_path':"https:" + play_poster[i], 'synopsis':synopsis, 'duration':duration})
        
    return plays
    
def download():
    movies = download_movies()
    #sys.exit()
    plays = download_plays()
    everything = movies + plays
    payload = {
        'ts': time.time(),
        'results': everything
    }
    f = open('bms.json', 'wb');
    f.write(json.dumps(payload))
    f.close()
    return payload
    
if __name__ == "__main__":
    #download()
    if not os.path.isfile('bms.json'):
        f = open('bms.json', 'wb')
        f.write(json.dumps({'ts':0, "results":[]}))
        f.close()
        
    f = open('bms.json', 'r')
    payload = json.loads(f.read())
    f.close()
    
    if (payload['ts'] < time.time() - (60 * 60 * 12)):
        payload = download()
    
    print json.dumps(payload)
    