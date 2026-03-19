/**
 * Podcast grid on the Podcasts page.
 * One line per episode: VIDEO_ID or VIDEO_ID|si (from embed …/embed/VIDEO?si=…)
 */
const PODCAST_ROWS = `
MAVD06YakZ4|1hbjHRn0ylWxNVMP
Z-M9SLVL6Cc|lU1PrxfSU-Cq1mNL
WAC4hMAb_0s|9UqEtYh-WtPXB1zi
W4_kxlRzdMc|2Eiuma6jKCiTFEzY
0mzpmx2eCHQ
X6WhjVND0RQ|toC-RoYQxjkZP01p
6ixipm18cs4|4_jhzrHKvsHukb7P
_2em2pshIgM|xLQG8sYWWAA931y6
WnRZi4e9XOM|2y_q6YRmLtxqzZQZ
UD_q7h-m3tM|Z04xufJ36_AAMJfd
Fmfo20WhBnQ|JPjzFEpHuBOOY1f0
KCMSmQUJmhw|KftcpeJmVcUVOyvf
wbW_tl9NgUc|dV-6fLQsC30A2HTj
w-hKAi0WABw|xGhjmW2HrvHgsopX
DEGFdgo2Ojs|P9l0kRnRzPx1M6fS
6e8ZCARXQ1I|G5mM9L1iYlDCMhPF
uZ34hZGkYbc|P_1EwJQnRhRuh7Q1
QlntPA3gA5U|1sDGGz77WwLoDqSN
xRXpznNzeg0|0-MjV5wf_ljy2gfb
fcAQ-zFXGXc|S77_wqOfA8bo9uff
NtsvgxoS9do|8BOzYOv4yWJ7DxZ8
SOi9SzIZruI|S1A_hauUMQbFviwa
u0XdaETDMjg|g01tQt3Qck_Hh3XR
gqRTUYwxmjM|mbgXgU4cPWX_sCPQ
bVsINPgyIPc|md0hseB9S_vKcal3
0vhi9YmF6Ss|8xRXQLE2ccH2rIqN
kXvWXv7ePCc|UR60ACLqb4VzqEU6
kLIQDt-066I|8I8dchjAheWXaeUe
7zOShRrwf08|9u559YTfhJYZfvFb
bp6ew3yFLhM|tOeq7PNCpMRYVgHv
MVOb0l-lvk8|_WE7rrDAajkgkWf9
KPeslt6FvxI|a8dEt2rsmX-FMbl3
tmwx0cj3mk8|VIcsrNbAvknjaE6S
UY4fdi72o2g|F20AKF5i0Dru_q0R
dM5hZs5QOWc|6Npwsrz-Y1726dq4
ho7PrUY3EeA|sAdnWfrHm_1vaLwN
kX__kP0QUMg|YsweT74wJivlW19m
tjgqETnLM4Y|HgtlIbJeMhO2KqAj
YobaEOZiP58|DG-kDdg0i0p2XxRm
03OyVEQ_yb8|uCJ-6Gv-TgbzSVju
wkeACs3xXR0|4Su3B6yAs-DP3tbG
lhkND-5yXio|D7n47SIsB52fAvTw
JfIfLMXz7eU|znruE2rcTQwO26Ff
YydySt8hCZg|woRUbgio7Q4KzDGr
L0IrzwvXwwI|AfZaMoWvYr2uAb_L
L0i41L4AwjU|3iqB9zUBLtA7vfNn
hl2bjK8M5zw|gL_z5444KhENwOqK
felq2wfkEOM|eqxbprPsegcGl37S
kQp3Z8fAoiA|ogYKxS2q8ZrfGCzZ
Tyjgg4gl4h4|SEhqOPh8OC1kblZx
`
  .trim()
  .split(/\n/)
  .map((line) => line.trim())
  .filter(Boolean);

/** si optional — channel RSS only provides video ids */
export type PodcastEpisode = { id: string; si?: string };

function parsePodcastRow(line: string): PodcastEpisode {
  const pipe = line.indexOf("|");
  if (pipe === -1) return { id: line.trim() };
  return { id: line.slice(0, pipe).trim(), si: line.slice(pipe + 1).trim() };
}

export const PODCAST_PAGE_VIDEOS: PodcastEpisode[] = PODCAST_ROWS.map(parsePodcastRow);

export function podcastPageVideoKey(v: PodcastEpisode) {
  return `${v.id}:${v.si ?? ""}`;
}
