import { Badge } from "@/components/ui/badge";
import { Award, Zap, Heart, MessageCircle, TrendingUp, Star } from "lucide-react";

interface MeritBadge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  unlockedAt?: string;
}

interface MeritBadgesProps {
  badges?: MeritBadge[];
  role?: "driver" | "pharmacist" | "staff" | "admin";
}

const badgeDefinitions: Record<string, MeritBadge> = {
  top_performer: {
    id: "top_performer",
    name: "Top Performer",
    description: "Completed 100+ deliveries/tasks",
    icon: <TrendingUp className="h-4 w-4" />,
    color: "bg-yellow-500",
  },
  five_star_champion: {
    id: "five_star_champion",
    name: "5-Star Champion",
    description: "Maintained 4.8+ rating for 30 days",
    icon: <Star className="h-4 w-4" />,
    color: "bg-yellow-400",
  },
  speed_demon: {
    id: "speed_demon",
    name: "Speed Demon",
    description: "98%+ on-time delivery rate",
    icon: <Zap className="h-4 w-4" />,
    color: "bg-blue-500",
  },
  customer_favorite: {
    id: "customer_favorite",
    name: "Customer Favorite",
    description: "500+ 5-star reviews",
    icon: <Heart className="h-4 w-4" />,
    color: "bg-red-500",
  },
  communication_expert: {
    id: "communication_expert",
    name: "Communication Expert",
    description: "Exceptional customer service feedback",
    icon: <MessageCircle className="h-4 w-4" />,
    color: "bg-green-500",
  },
  efficiency_master: {
    id: "efficiency_master",
    name: "Efficiency Master",
    description: "Process time 30% below average",
    icon: <Zap className="h-4 w-4" />,
    color: "bg-purple-500",
  },
  accuracy_badge: {
    id: "accuracy_badge",
    name: "Accuracy Expert",
    description: "99%+ accuracy rate",
    icon: <Award className="h-4 w-4" />,
    color: "bg-indigo-500",
  },
  milestone_100: {
    id: "milestone_100",
    name: "Century Milestone",
    description: "Served 100 unique customers",
    icon: <Award className="h-4 w-4" />,
    color: "bg-orange-500",
  },
};

export function MeritBadges({ badges = [], role }: MeritBadgesProps) {
  const displayBadges = badges.length > 0 ? badges : Object.values(badgeDefinitions).slice(0, 3);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-sm mb-3">Merit Badges & Achievements</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {displayBadges.map((badge) => (
            <div
              key={badge.id}
              className="relative group"
              data-testid={`badge-${badge.id}`}
            >
              <div className={`${badge.color} text-white p-4 rounded-lg text-center cursor-help hover-elevate active-elevate-2 transition`}>
                <div className="flex justify-center mb-2">{badge.icon}</div>
                <p className="text-xs font-bold line-clamp-2">{badge.name}</p>
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded p-2 whitespace-nowrap z-10">
                {badge.description}
                {badge.unlockedAt && <p className="text-yellow-300 mt-1">Unlocked: {badge.unlockedAt}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { badgeDefinitions };
