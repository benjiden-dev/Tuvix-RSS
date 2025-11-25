/**
 * Audio Player Progress Tests
 *
 * Tests for AudioPlayer component with progress tracking
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test/test-utils";
import { AudioPlayer } from "../audio-player";
import * as audioContext from "@/contexts/audio-context";
import * as useAudioProgressModule from "@/lib/hooks/useAudioProgress";

// Mock dependencies
vi.mock("@/contexts/audio-context");
vi.mock("@/lib/hooks/useAudioProgress");

describe("AudioPlayer with Progress", () => {
  const mockPauseAudio = vi.fn();
  const mockSeekTo = vi.fn();
  const mockPlay = vi.fn();
  const mockUseAudioProgressSync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock audio context
    vi.mocked(audioContext.useAudio).mockReturnValue({
      currentAudioId: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      pauseAudio: mockPauseAudio,
      seekTo: mockSeekTo,
    } as any);

    // Mock audio progress hooks
    vi.mocked(useAudioProgressModule.useAudioProgressSync).mockImplementation(
      mockUseAudioProgressSync,
    );

    vi.mocked(useAudioProgressModule.useAudioProgressRestore).mockReturnValue({
      play: mockPlay,
    });
  });

  it("should render with no progress", () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        articleId={1}
        title="Test Episode"
      />,
    );

    expect(screen.getByLabelText("Play")).toBeInTheDocument();
    // Should have two "0:00" labels (current time and duration)
    const timeLabels = screen.getAllByText("0:00");
    expect(timeLabels).toHaveLength(2);
  });

  it("should render with existing progress", () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        articleId={1}
        title="Test Episode"
        audioProgress={{
          position: 1200,
          duration: 3600,
          completedAt: null,
        }}
      />,
    );

    // Should still show 0:00 since it's not the current audio
    const timeLabels = screen.getAllByText("0:00");
    expect(timeLabels).toHaveLength(2);
  });

  it("should call useAudioProgressSync with article ID", () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        articleId={42}
        title="Test Episode"
      />,
    );

    expect(mockUseAudioProgressSync).toHaveBeenCalledWith(42);
  });

  it("should call useAudioProgressRestore with correct params", () => {
    const audioProgress = {
      position: 1200,
      duration: 3600,
      completedAt: null,
    };

    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        articleId={1}
        title="Test Episode"
        audioProgress={audioProgress}
      />,
    );

    expect(useAudioProgressModule.useAudioProgressRestore).toHaveBeenCalledWith(
      1,
      "https://example.com/audio.mp3",
      audioProgress,
    );
  });

  it("should use restored play function when play button clicked", async () => {
    const user = userEvent.setup();

    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        articleId={1}
        title="Test Episode"
        audioProgress={{
          position: 1200,
          duration: 3600,
          completedAt: null,
        }}
      />,
    );

    const playButton = screen.getByLabelText("Play");
    await user.click(playButton);

    expect(mockPlay).toHaveBeenCalled();
  });

  it("should show current time when audio is playing", () => {
    vi.mocked(audioContext.useAudio).mockReturnValue({
      currentAudioId: 1,
      isPlaying: true,
      currentTime: 125,
      duration: 3600,
      pauseAudio: mockPauseAudio,
      seekTo: mockSeekTo,
    } as any);

    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        articleId={1}
        title="Test Episode"
        audioProgress={{
          position: 120,
          duration: 3600,
          completedAt: null,
        }}
      />,
    );

    // Should show actual current time, not saved progress
    expect(screen.getByText("2:05")).toBeInTheDocument(); // 125 seconds
    expect(screen.getByText("60:00")).toBeInTheDocument(); // 3600 seconds = 60 minutes
  });

  it("should show pause button when audio is playing", () => {
    vi.mocked(audioContext.useAudio).mockReturnValue({
      currentAudioId: 1,
      isPlaying: true,
      currentTime: 100,
      duration: 3600,
      pauseAudio: mockPauseAudio,
      seekTo: mockSeekTo,
    } as any);

    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        articleId={1}
        title="Test Episode"
      />,
    );

    expect(screen.getByLabelText("Pause")).toBeInTheDocument();
  });

  it("should call pauseAudio when pause button clicked", async () => {
    const user = userEvent.setup();

    vi.mocked(audioContext.useAudio).mockReturnValue({
      currentAudioId: 1,
      isPlaying: true,
      currentTime: 100,
      duration: 3600,
      pauseAudio: mockPauseAudio,
      seekTo: mockSeekTo,
    } as any);

    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        articleId={1}
        title="Test Episode"
      />,
    );

    const pauseButton = screen.getByLabelText("Pause");
    await user.click(pauseButton);

    expect(mockPauseAudio).toHaveBeenCalled();
  });

  it("should show loading state when play button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        articleId={1}
        title="Test Episode"
      />,
    );

    const playButton = screen.getByLabelText("Play");
    await user.click(playButton);

    // Should show loading icon briefly
    await waitFor(
      () => {
        const button = screen.getByRole("button");
        expect(button).toHaveAttribute("disabled");
      },
      { timeout: 100 },
    );
  });

  it("should highlight when current audio is playing", () => {
    vi.mocked(audioContext.useAudio).mockReturnValue({
      currentAudioId: 1,
      isPlaying: true,
      currentTime: 100,
      duration: 3600,
      pauseAudio: mockPauseAudio,
      seekTo: mockSeekTo,
    } as any);

    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        articleId={1}
        title="Test Episode"
      />,
    );

    const playButton = screen.getByLabelText("Pause");
    expect(playButton).toHaveClass("text-primary");
  });

  it("should not highlight when different audio is playing", () => {
    vi.mocked(audioContext.useAudio).mockReturnValue({
      currentAudioId: 2,
      isPlaying: true,
      currentTime: 100,
      duration: 3600,
      pauseAudio: mockPauseAudio,
      seekTo: mockSeekTo,
    } as any);

    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        articleId={1}
        title="Test Episode"
      />,
    );

    const playButton = screen.getByLabelText("Play");
    expect(playButton).not.toHaveClass("text-primary");
  });

  it("should pass audioProgress as undefined when not provided", () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        articleId={1}
        title="Test Episode"
      />,
    );

    expect(useAudioProgressModule.useAudioProgressRestore).toHaveBeenCalledWith(
      1,
      "https://example.com/audio.mp3",
      undefined,
    );
  });

  it("should handle completed audioProgress", () => {
    const completedAt = new Date();

    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        articleId={1}
        title="Test Episode"
        audioProgress={{
          position: 3600,
          duration: 3600,
          completedAt,
        }}
      />,
    );

    // Should still render normally
    expect(screen.getByLabelText("Play")).toBeInTheDocument();
  });

  it("should sync progress for current audio only", () => {
    // First render with article 1
    const { rerender } = render(
      <AudioPlayer
        audioUrl="https://example.com/audio1.mp3"
        articleId={1}
        title="Episode 1"
      />,
    );

    expect(mockUseAudioProgressSync).toHaveBeenCalledWith(1);

    mockUseAudioProgressSync.mockClear();

    // Rerender with article 2
    rerender(
      <AudioPlayer
        audioUrl="https://example.com/audio2.mp3"
        articleId={2}
        title="Episode 2"
      />,
    );

    expect(mockUseAudioProgressSync).toHaveBeenCalledWith(2);
  });
});
