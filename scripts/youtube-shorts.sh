#!/bin/bash
set -uo pipefail

# ============================================================
# Конфигурация
# ============================================================
OUTPUT_DIR="/media/portable/.3f-lab/_humanitarian/zateyki/shorts"
SHORT_AUDIO="/media/portable/.3f-lab/_humanitarian/zateyki/shorts/audio.mp3"
mkdir -p "$OUTPUT_DIR"

STATE_FILE="/tmp/widget_recording.pid"
TIMESTAMP_FILE="/tmp/widget_recording.timestamp"

# Координаты области захвата
CAPTURE_X=656
CAPTURE_Y=0
CAPTURE_W=608
CAPTURE_H=1080

# Выходное разрешение (YouTube Shorts)
OUT_W=1080
OUT_H=1920

# Микрофон (используется, если SHORT_AUDIO не задан)
MIC="alsa_input.usb-MUSIC-BOOST_Usb_Microphone-00.mono-fallback"

# Аудиофайл-замена (опционально). Если задан и существует — пишется без микрофона.
SHORT_AUDIO="${SHORT_AUDIO:-}"

# Лимит YouTube Shorts
MAX_SHORT_DURATION=60

# ============================================================
# Вспомогательная функция: получить длительность медиафайла
# ============================================================
get_duration() {
    ffprobe -v error -show_entries format=duration \
        -of default=noprint_wrappers=1:nokey=1 "$1" 2>/dev/null \
    | cut -d. -f1
}

# ============================================================
# Логика toggle
# ============================================================
if [[ -f "$STATE_FILE" ]]; then
    # --- СТОП ---
    notify-send "⏹ Запись виджета остановлена" -t 2000
    PID=$(cat "$STATE_FILE")
    TIMESTAMP=$(cat "$TIMESTAMP_FILE")

    echo "⏹  Останавливаю запись (PID=$PID)..."
    kill -INT "$PID" 2>/dev/null
    sleep 2

    rm -f "$STATE_FILE" "$TIMESTAMP_FILE"

    INPUT_MKV="$OUTPUT_DIR/widget_${TIMESTAMP}.mkv"
    OUTPUT_MP4="$OUTPUT_DIR/widget_${TIMESTAMP}.mp4"

    if [[ ! -f "$INPUT_MKV" ]]; then
        echo "❌ Файл записи не найден: $INPUT_MKV"
        exit 1
    fi

    # --- Определяем источник аудио ---
    USE_EXTERNAL_AUDIO=0
    if [[ -n "$SHORT_AUDIO" ]]; then
        if [[ -f "$SHORT_AUDIO" ]]; then
            USE_EXTERNAL_AUDIO=1
            echo "🎵 Используем внешний аудиофайл: $SHORT_AUDIO"
        else
            echo "⚠  SHORT_AUDIO задан, но файл не найден: $SHORT_AUDIO"
            echo "   Запись велась без звука — итоговый ролик будет без аудио."
        fi
    fi

    # --- Вычисляем целевую длительность ---
    dur_video=$(get_duration "$INPUT_MKV")

    if [[ "$USE_EXTERNAL_AUDIO" -eq 1 ]]; then
        dur_audio=$(get_duration "$SHORT_AUDIO")
        # max(video, audio), но не больше лимита
        if [[ "$dur_video" -ge "$dur_audio" ]]; then
            target=$dur_video
        else
            target=$dur_audio
        fi
        [[ "$target" -gt "$MAX_SHORT_DURATION" ]] && target=$MAX_SHORT_DURATION

        echo "🎞  Длительность: видео=${dur_video}с, аудио=${dur_audio}с → итог=${target}с"

        # Видео растягиваем (tpad клонирует последний кадр), аудио обрезаем/оставляем
        ffmpeg -y -loglevel error \
            -i "$INPUT_MKV" \
            -i "$SHORT_AUDIO" \
            -filter_complex "[0:v]tpad=stop_mode=clone,format=yuv420p,\
scale=${OUT_W}:${OUT_H}:force_original_aspect_ratio=decrease,\
pad=${OUT_W}:${OUT_H}:(ow-iw)/2:(oh-ih)/2:black[v]" \
            -map "[v]" -map 1:a \
            -c:v libx264 -preset slow -crf 20 \
            -c:a aac -b:a 192k \
            -t "$target" \
            -movflags +faststart \
            "$OUTPUT_MP4"
    else
        # Режим микрофона: аудио уже внутри mkv
        target=$dur_video
        [[ "$target" -gt "$MAX_SHORT_DURATION" ]] && target=$MAX_SHORT_DURATION

        echo "🎞  Длительность: ${dur_video}с (с микрофоном)"

        ffmpeg -y -loglevel error \
            -i "$INPUT_MKV" \
            -vf "tpad=stop_mode=clone,format=yuv420p,\
scale=${OUT_W}:${OUT_H}:force_original_aspect_ratio=decrease,\
pad=${OUT_W}:${OUT_H}:(ow-iw)/2:(oh-ih)/2:black" \
            -c:v libx264 -preset slow -crf 20 \
            -c:a aac -b:a 192k \
            -t "$target" \
            -movflags +faststart \
            "$OUTPUT_MP4"
    fi

    rm -f "$INPUT_MKV"
    echo "✅ Готово: $OUTPUT_MP4"
    notify-send "🏁 Видео готово к выгрузке" -t 2000

else
    # --- СТАРТ ---
    notify-send "🎬 Запись виджета начата" -t 2000

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    OUTPUT_MKV="$OUTPUT_DIR/widget_${TIMESTAMP}.mkv"

    if [[ -n "$SHORT_AUDIO" && -f "$SHORT_AUDIO" ]]; then
        # Режим внешнего аудио: пишем ТОЛЬКО видео
        echo "🎬 Начинаю запись виджета (без микрофона, аудио подставим позже)..."
        echo "   Область: ${CAPTURE_W}x${CAPTURE_H}+${CAPTURE_X}+${CAPTURE_Y}"
        echo "   Аудио: $SHORT_AUDIO"
        echo "   Нажмите Alt+V для остановки."

        ffmpeg -f x11grab -framerate 30 \
               -video_size ${CAPTURE_W}x${CAPTURE_H} \
               -i :0.0+${CAPTURE_X},${CAPTURE_Y} \
               -c:v libx264 -preset ultrafast -crf 18 \
               "$OUTPUT_MKV" &
    else    
        # Режим микрофона: пишем видео + аудио
        if [[ -n "$SHORT_AUDIO" ]]; then
            echo "⚠  SHORT_AUDIO=$SHORT_AUDIO не найден — переключаюсь на микрофон."
        fi
        echo "🎬 Начинаю запись виджета с микрофоном..."
        echo "   Область: ${CAPTURE_W}x${CAPTURE_H}+${CAPTURE_X}+${CAPTURE_Y}"
        echo "   Нажмите Alt+V для остановки."

        ffmpeg -f x11grab -framerate 30 \
               -video_size ${CAPTURE_W}x${CAPTURE_H} \
               -i :0.0+${CAPTURE_X},${CAPTURE_Y} \
               -f pulse -i "$MIC" \
               -ac 2 -ar 44100 \
               -c:v libx264 -preset ultrafast -crf 18 \
               -c:a aac -b:a 192k \
               "$OUTPUT_MKV" &
    fi

    echo $! > "$STATE_FILE"
    echo "$TIMESTAMP" > "$TIMESTAMP_FILE"
fi