#!/bin/sh
# Mux picture + soundtrack, normalize loudness for Instagram, and export deliverables.
#   sh scripts/finalize.sh <silent_video.mp4> [suffix]
# Produces exports/vektorlab_reel_final.mp4, previews/vektorlab_reel_review.mp4,
# and exports/vektorlab_reel_15s.mp4 (beat-aligned short cut).
set -eu
cd "$(dirname "$0")/.."
SRC="${1:-previews/master_silent.mp4}"
WAV=audio/vektorlab_reel_mix.wav
mkdir -p exports previews

# Two-pass EBU R128 loudness normalization to -14 LUFS / -1 dBTP.
STATS=$(ffmpeg -hide_banner -i "$WAV" -af loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
MI=$(echo "$STATS" | sed -n 's/.*"input_i" : "\(.*\)",/\1/p')
MTP=$(echo "$STATS" | sed -n 's/.*"input_tp" : "\(.*\)",/\1/p')
MLRA=$(echo "$STATS" | sed -n 's/.*"input_lra" : "\(.*\)",/\1/p')
MTH=$(echo "$STATS" | sed -n 's/.*"input_thresh" : "\(.*\)",/\1/p')
OFF=$(echo "$STATS" | sed -n 's/.*"target_offset" : "\(.*\)"/\1/p')
ffmpeg -hide_banner -loglevel error -y -i "$WAV" \
  -af "loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=$MI:measured_TP=$MTP:measured_LRA=$MLRA:measured_thresh=$MTH:offset=$OFF:linear=true,aresample=48000" \
  -c:a pcm_s16le audio/vektorlab_reel_mix_norm.wav

# Final: H.264 High, yuv420p, 30 fps CFR, AAC 320k stereo 48 kHz, faststart.
ffmpeg -hide_banner -loglevel error -y -i "$SRC" -i audio/vektorlab_reel_mix_norm.wav \
  -map 0:v:0 -map 1:a:0 -c:v libx264 -profile:v high -level 4.2 -preset slow -crf 16 -pix_fmt yuv420p -r 30 -g 60 \
  -c:a aac -b:a 320k -ar 48000 -ac 2 -shortest -movflags +faststart \
  -metadata title="VektorLab — Don't start from zero" exports/vektorlab_reel_final.mp4

# Review preview: half resolution, small file.
ffmpeg -hide_banner -loglevel error -y -i exports/vektorlab_reel_final.mp4 -vf scale=540:960 -c:v libx264 -preset medium -crf 26 -c:a aac -b:a 128k -movflags +faststart previews/vektorlab_reel_review.mp4

# 15 s cut: segments on the 0.5 s beat grid, joined with 2-frame video / 25 ms audio crossfades.
SEGS="0:2.5 4:6 7:8 9.5:10.5 13:14 17:19 24.5:30"
i=0; LIST=""
for s in $SEGS; do
  a=${s%%:*}; b=${s##*:}
  ffmpeg -hide_banner -loglevel error -y -ss "$a" -to "$b" -i exports/vektorlab_reel_final.mp4 \
    -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -r 30 -c:a pcm_s16le -ar 48000 \
    -af "afade=t=in:d=0.02,afade=t=out:st=$(printf "%.3f" "$(echo "$b - $a - 0.025" | bc)"):d=0.025" "previews/_seg$i.mkv"
  LIST="$LIST previews/_seg$i.mkv"; i=$((i + 1))
done
printf "file '%s'\n" $(echo $LIST | sed 's#previews/##g') > previews/_segs.txt
(cd previews && ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i _segs.txt -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -r 30 -c:a aac -b:a 320k -movflags +faststart ../exports/vektorlab_reel_15s.mp4)
rm -f previews/_seg*.mkv previews/_segs.txt
echo "exports ready"

# Instagram upload copies: full resolution, two-pass H.264 under 30 MB.
for spec in "vektorlab_reel_final.mp4 vektorlab_reel_instagram.mp4 6800k" "vektorlab_reel_15s.mp4 vektorlab_reel_15s_instagram.mp4 12000k"; do
  set -- $spec
  ffmpeg -hide_banner -loglevel error -y -i "exports/$1" -c:v libx264 -preset slow -b:v "$3" -pass 1 -passlogfile "previews/_x264_$2" -an -f mp4 /dev/null
  ffmpeg -hide_banner -loglevel error -y -i "exports/$1" -c:v libx264 -preset slow -profile:v high -level 4.2 -b:v "$3" -maxrate "$3" -bufsize 2M -pass 2 -passlogfile "previews/_x264_$2" \
    -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 48000 -movflags +faststart "exports/$2"
done
rm -f previews/_x264_*
echo "instagram copies ready"
