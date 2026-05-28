"""
Seeds/updates the 2026 draft class with ESPN's official rankings.
Upserts by name — updates projected_pick for combine participants already
in DB, inserts remaining prospects (e.g. AJ Dybantsa who skipped combine).
Run: python3 seed_2026_espn_board.py
"""
import sys
import logging
from lib.db import fetchall, execute

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

# ESPN 2026 NBA Draft Rankings (as of May 2026)
ESPN_BOARD = [
    (1,  'AJ Dybantsa',         'BYU',              'F'),
    (2,  'Darryn Peterson',      'Kansas',            'G'),
    (3,  'Cameron Boozer',       'Duke',              'F'),
    (4,  'Caleb Wilson',         'North Carolina',    'F'),
    (5,  'Keaton Wagler',        'Illinois',          'G'),
    (6,  'Darius Acuff Jr.',     'Arkansas',          'G'),
    (7,  'Kingston Flemings',    'Houston',           'G'),
    (8,  'Nate Ament',           'Tennessee',         'F'),
    (9,  'Mikel Brown Jr.',      'Louisville',        'G'),
    (10, 'Brayden Burries',      'Arizona',           'G'),
    (11, 'Karim Lopez',          'Mexico',            'F'),
    (12, 'Yaxel Lendeborg',      'Michigan',          'F'),
    (13, 'Aday Mara',            'Michigan',          'C'),
    (14, 'Hannes Steinbach',     'Washington',        'F'),
    (15, 'Labaron Philon Jr.',   'Alabama',           'G'),
    (16, 'Chris Cenac Jr.',      'Houston',           'F'),
    (17, 'Christian Anderson',   'Texas Tech',        'G'),
    (18, 'Jayden Quaintance',    'Kentucky',          'F'),
    (19, 'Isaiah Evans',         'Duke',              'G'),
    (20, 'Koa Peat',             'Arizona',           'F'),
    (21, 'Bennett Stirtz',       'Iowa',              'G'),
    (22, 'Cameron Carr',         'Baylor',            'G'),
    (23, 'Dailyn Swain',         'Texas',             'G'),
    (24, 'Morez Johnson Jr.',    'Michigan',          'F'),
    (25, 'Meleek Thomas',        'Arkansas',          'G'),
    (26, 'Ebuka Okorie',         'Stanford',          'G'),
    (27, 'Henri Veesaar',        'North Carolina',    'C'),
    (28, 'Amari Allen',          'Alabama',           'F'),
    (29, 'Joshua Jefferson',     'Iowa State',        'F'),
    (30, 'Alex Karaban',         'UConn',             'F'),
    (31, 'Zuby Ejiofor',         'St. Johns',         'F'),
    (32, 'Luigi Suigo',          'Italy',             'C'),
    (33, 'Tarris Reed Jr.',      'UConn',             'C'),
    (34, 'Ryan Conwell',         'Louisville',        'G'),
    (35, 'Sergio de Larrea',     'Spain',             'F'),
    (36, 'Braden Smith',         'Purdue',            'G'),
    (37, 'Billy Richmond III',   'Arkansas',          'G'),
    (38, 'Ugonna Onyenso',       'Virginia',          'C'),
    (39, 'Baba Miller',          'Cincinnati',        'F'),
    (40, 'Jaden Bradley',        'Arizona',           'G'),
    (41, 'Jack Kayil',           'Germany',           'G'),
    (42, 'Trevon Brazile',       'Arkansas',          'F'),
    (43, 'Bruce Thornton',       'Ohio State',        'G'),
    (44, 'Richie Saunders',      'BYU',               'G'),
    (45, 'Felix Okpara',         'Tennessee',         'F'),
    (46, 'Izaiyah Nelson',       'South Florida',     'F'),
    (47, 'Jeremy Fears Jr.',     'Michigan State',    'G'),
    (48, 'Kylan Boswell',        'Illinois',          'G'),
    (49, 'Tyler Nickel',         'Vanderbilt',        'F'),
    (50, 'Ja\'Kobi Gillespie',   'Tennessee',         'G'),
    (51, 'Emanuel Sharp',        'Houston',           'G'),
    (52, 'Milos Uzan',           'Houston',           'G'),
    (53, 'Tyler Bilodeau',       'UCLA',              'F'),
    (54, 'Nick Martinelli',      'Northwestern',      'F'),
    (55, 'Maliq Brown',          'Duke',              'F'),
    (56, 'John Blackwell',       'Wisconsin',         'G'),
    (57, 'Bryce Hopkins',        'St. Johns',         'F'),
    (58, 'Tobi Lawal',           'Virginia Tech',     'F'),
    (59, 'Oscar Cluff',          'Purdue',            'C'),
    (60, 'Alex Samodurov',       'Greece',            'C'),
    (61, 'Tamin Lipsey',         'Iowa State',        'G'),
    (62, 'Tobe Awaka',           'Arizona',           'F'),
    (63, 'Nate Bittle',          'Oregon',            'C'),
    (64, 'Quadir Copeland',      'NC State',          'G'),
    (65, 'Otega Oweh',           'Kentucky',          'G'),
    (66, 'Peter Suder',          'Miami (OH)',         'G'),
    (67, 'Trey Kaufman-Renn',    'Purdue',            'F'),
    (68, 'Jaden Henley',         'Grand Canyon',      'G'),
    (69, 'Keyshawn Hall',        'Auburn',            'F'),
    (70, 'Rafael Castro',        'George Washington', 'F'),
    (71, 'Pavle Backo',          'Serbia',            'F'),
    (72, 'Nick Boyd',            'Wisconsin',         'G'),
    (73, 'Jaron Pierre Jr.',     'SMU',               'G'),
    (74, 'Dillon Mitchell',      'St. Johns',         'F'),
    (75, 'Darrion Williams',     'NC State',          'F'),
    (76, 'Graham Ike',           'Gonzaga',           'F'),
    (77, 'Tucker DeVries',       'Indiana',           'F'),
    (78, 'Braden Huff',          'Gonzaga',           'F'),
    (79, 'Seth Trimble',         'North Carolina',    'G'),
    (80, 'Cade Tyson',           'Minnesota',         'G'),
    (81, 'Donovan Dent',         'UCLA',              'G'),
    (82, 'Aaron Nkrumah',        'Tennessee State',   'G'),
    (83, 'Tre Donaldson',        'Miami',             'G'),
    (84, 'William Kyle III',     'Syracuse',          'F'),
    (85, 'Bassala Bagayoko',     'Mali',              'C'),
    (86, 'Josh Dix',             'Creighton',         'G'),
    (87, 'Lamar Wilkerson',      'Indiana',           'G'),
    (88, 'Melvin Council Jr.',   'Kansas',            'G'),
    (89, 'Tre White',            'Kansas',            'G'),
    (90, 'Fletcher Loyer',       'Purdue',            'G'),
    (91, 'Malik Reneau',         'Miami',             'F'),
    (92, 'Lajae Jones',          'Florida State',     'G'),
    (93, 'Ernest Udeh Jr.',      'Miami',             'C'),
    (94, 'Xaivian Lee',          'Florida',           'G'),
    (95, 'Mark Mitchell',        'Missouri',          'G'),
    (96, 'Kashie Natt',          'Sam Houston',       'G'),
    (97, 'Nimari Burnett',       'Michigan',          'G'),
]

DRAFT_YEAR = 2026


def normalize(name: str) -> str:
    """Lowercase, strip punctuation variants for fuzzy matching."""
    return name.lower().replace("'", '').replace('.', '').replace('-', ' ').strip()


def run():
    existing = fetchall('SELECT id, name FROM prospects WHERE draft_year = :y', {'y': DRAFT_YEAR})
    name_to_id = {normalize(r['name']): r['id'] for r in existing}

    updated = inserted = 0

    for rank, name, school, position in ESPN_BOARD:
        key = normalize(name)
        pick_low = max(1, rank - 5)
        pick_high = rank + 5

        if key in name_to_id:
            execute("""
                UPDATE prospects SET
                    projected_pick = :pick,
                    projected_pick_low = :low,
                    projected_pick_high = :high,
                    position = :pos,
                    school = :school,
                    updated_at = now()
                WHERE id = :id
            """, {
                'id': name_to_id[key],
                'pick': rank, 'low': pick_low, 'high': pick_high,
                'pos': position, 'school': school,
            })
            updated += 1
        else:
            execute("""
                INSERT INTO prospects (
                    name, position, draft_year, projected_pick,
                    projected_pick_low, projected_pick_high, school,
                    data_completeness
                ) VALUES (
                    :name, :pos, :year, :pick, :low, :high, :school, 'limited'
                )
            """, {
                'name': name, 'pos': position, 'year': DRAFT_YEAR,
                'pick': rank, 'low': pick_low, 'high': pick_high,
                'school': school,
            })
            inserted += 1
            logger.info(f'  Inserted new: {name} (#{rank})')

    logger.info(f'Done — {updated} updated, {inserted} inserted')


if __name__ == '__main__':
    run()
    sys.exit(0)
