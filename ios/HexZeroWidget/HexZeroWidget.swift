import WidgetKit
import SwiftUI

struct GameStats: Codable {
    let gamesPlayed: Int
    let gamesWon: Int
    let winRate: Double
    let currentStreak: Int
    let lastPlayedDate: Date?
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), stats: GameStats(
            gamesPlayed: 0,
            gamesWon: 0,
            winRate: 0,
            currentStreak: 0,
            lastPlayedDate: nil
        ))
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), stats: loadGameStats())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [SimpleEntry] = []
        let stats = loadGameStats()

        // Generate a timeline with updates every hour
        let currentDate = Date()
        for hourOffset in 0 ..< 5 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = SimpleEntry(date: entryDate, stats: stats)
            entries.append(entry)
        }

        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }

    private func loadGameStats() -> GameStats {
        // Access shared UserDefaults from app group
        let sharedDefaults = UserDefaults(suiteName: "group.com.hexzero.game")

        // Load stats from shared storage
        let gamesPlayed = sharedDefaults?.integer(forKey: "widget_gamesPlayed") ?? 0
        let gamesWon = sharedDefaults?.integer(forKey: "widget_gamesWon") ?? 0
        let currentStreak = sharedDefaults?.integer(forKey: "widget_currentStreak") ?? 0
        let lastPlayedTimestamp = sharedDefaults?.double(forKey: "widget_lastPlayed") ?? 0

        let winRate = gamesPlayed > 0 ? Double(gamesWon) / Double(gamesPlayed) : 0
        let lastPlayedDate = lastPlayedTimestamp > 0 ? Date(timeIntervalSince1970: lastPlayedTimestamp) : nil

        return GameStats(
            gamesPlayed: gamesPlayed,
            gamesWon: gamesWon,
            winRate: winRate,
            currentStreak: currentStreak,
            lastPlayedDate: lastPlayedDate
        )
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let stats: GameStats
}

struct HexZeroWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(stats: entry.stats)
        case .systemMedium:
            MediumWidgetView(stats: entry.stats)
        case .systemLarge:
            LargeWidgetView(stats: entry.stats)
        @unknown default:
            SmallWidgetView(stats: entry.stats)
        }
    }
}

struct SmallWidgetView: View {
    let stats: GameStats

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "hexagon.fill")
                    .foregroundColor(.blue)
                Text("Hex Zero")
                    .font(.headline)
                    .foregroundColor(.primary)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Games: \(stats.gamesPlayed)")
                    .font(.caption)
                Text("Win Rate: \(Int(stats.winRate * 100))%")
                    .font(.caption)
                if stats.currentStreak > 0 {
                    Text("🔥 Streak: \(stats.currentStreak)")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }

            Spacer()
        }
        .padding()
        .containerBackground(for: .widget) {
            Color(UIColor.systemBackground)
        }
    }
}

struct MediumWidgetView: View {
    let stats: GameStats

    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "hexagon.fill")
                        .foregroundColor(.blue)
                    Text("Hex Zero")
                        .font(.headline)
                }

                Spacer()

                VStack(alignment: .leading, spacing: 4) {
                    Text("Total Games: \(stats.gamesPlayed)")
                        .font(.subheadline)
                    Text("Games Won: \(stats.gamesWon)")
                        .font(.subheadline)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 8) {
                if stats.currentStreak > 0 {
                    VStack(alignment: .trailing) {
                        Text("Current Streak")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("🔥 \(stats.currentStreak)")
                            .font(.title2)
                            .foregroundColor(.orange)
                    }
                }

                Spacer()

                VStack(alignment: .trailing) {
                    Text("Win Rate")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(Int(stats.winRate * 100))%")
                        .font(.title3)
                        .bold()
                }
            }
        }
        .padding()
        .containerBackground(for: .widget) {
            Color(UIColor.systemBackground)
        }
    }
}

struct LargeWidgetView: View {
    let stats: GameStats

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "hexagon.fill")
                    .foregroundColor(.blue)
                    .font(.title)
                Text("Hex Zero")
                    .font(.title2)
                    .bold()
            }

            Divider()

            HStack(spacing: 24) {
                StatBox(title: "Games Played", value: "\(stats.gamesPlayed)", icon: "gamecontroller.fill")
                StatBox(title: "Games Won", value: "\(stats.gamesWon)", icon: "trophy.fill")
            }

            HStack(spacing: 24) {
                StatBox(title: "Win Rate", value: "\(Int(stats.winRate * 100))%", icon: "percent")
                if stats.currentStreak > 0 {
                    StatBox(title: "Current Streak", value: "\(stats.currentStreak)", icon: "flame.fill", color: .orange)
                } else {
                    StatBox(title: "Current Streak", value: "0", icon: "flame")
                }
            }

            if let lastPlayed = stats.lastPlayedDate {
                Text("Last played \(lastPlayed, style: .relative) ago")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Link(destination: URL(string: "hexzero://play")!) {
                HStack {
                    Spacer()
                    Text("Play Now")
                        .font(.headline)
                    Image(systemName: "arrow.right.circle.fill")
                    Spacer()
                }
                .padding(.vertical, 12)
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
        }
        .padding()
        .containerBackground(for: .widget) {
            Color(UIColor.systemBackground)
        }
    }
}

struct StatBox: View {
    let title: String
    let value: String
    let icon: String
    var color: Color = .blue

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.caption)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Text(value)
                .font(.title2)
                .bold()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct HexZeroWidget: Widget {
    let kind: String = "HexZeroWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            HexZeroWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Hex Zero Stats")
        .description("View your game statistics and progress")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// Required for SwiftUI previews
struct HexZeroWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            HexZeroWidgetEntryView(entry: SimpleEntry(date: Date(), stats: GameStats(
                gamesPlayed: 42,
                gamesWon: 28,
                winRate: 0.67,
                currentStreak: 5,
                lastPlayedDate: Date()
            )))
            .previewContext(WidgetPreviewContext(family: .systemSmall))

            HexZeroWidgetEntryView(entry: SimpleEntry(date: Date(), stats: GameStats(
                gamesPlayed: 42,
                gamesWon: 28,
                winRate: 0.67,
                currentStreak: 5,
                lastPlayedDate: Date()
            )))
            .previewContext(WidgetPreviewContext(family: .systemMedium))

            HexZeroWidgetEntryView(entry: SimpleEntry(date: Date(), stats: GameStats(
                gamesPlayed: 42,
                gamesWon: 28,
                winRate: 0.67,
                currentStreak: 5,
                lastPlayedDate: Date()
            )))
            .previewContext(WidgetPreviewContext(family: .systemLarge))
        }
    }
}
