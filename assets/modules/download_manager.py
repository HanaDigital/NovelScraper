import sys
from novel_planet import NovelPlanet
from box_novel import BoxNovel

link = sys.argv[1]
storage_path = sys.argv[2]
source = sys.argv[3]
update = sys.argv[4]

if(source == "novelplanet"):
    np = NovelPlanet(link, r"%s" % storage_path)
    if(update == "false"):
        np.create_novel()
    else:
        np.update_novel()
elif(source == "boxnovel"):
    bn = BoxNovel(link, r"%s" % storage_path)
    bn.create_novel()