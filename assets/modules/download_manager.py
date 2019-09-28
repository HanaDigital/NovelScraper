import sys
from novel_planet_downloader import NovelPlanet
from box_novel_downloader import BoxNovel

link = sys.argv[1]
storage_path = sys.argv[2]
source = sys.argv[3]

if(source == "novelplanet"):
    np = NovelPlanet(link, r"%s" % storage_path)
    np.create_novel()
elif(source == "boxnovel"):
    bn = BoxNovel(link, r"%s" % storage_path)
    bn.create_novel()