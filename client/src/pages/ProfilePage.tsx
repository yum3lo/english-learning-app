import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Headphones, Flower, Flame, Zap, Edit3, Mail, Sprout, TrendingUp, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CATEGORIES, POINTS_PER_LEVEL } from '@/constants/categories';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import PageContainer from '@/components/PageContainer';
import unicorn from '@/assets/unicorn.png';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedCategories, setEditedCategories] = useState<string[]>(user?.fieldsOfInterest || []);
  const { toast } = useToast();

  // update local state when user data changes
  useEffect(() => {
    if (user) {
      setEditedName(user.name);
      setEditedCategories(user.fieldsOfInterest);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
            <p className="text-sm text-muted-foreground">Please log in to view your profile.</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const statsData = [
    {
      title: "Articles read",
      value: user.articlesRead || 0,
      icon: BookOpen,
      color: "text-secondary",
    },
    {
      title: "Videos watched",
      value: user.videosWatched || 0,
      icon: Headphones,
      color: "text-accent",
    },
    {
      title: "Words grown",
      value: user.wordsLearned || 0,
      icon: Flower,
      color: "text-bloom",
    },
    {
      title: "Day streak",
      value: user.streakCount || 0,
      icon: Flame,
      color: "text-accent",
    },
  ];

  const currentLevelPoints = user.points;
  const pointsNeededForNextLevel = POINTS_PER_LEVEL;
  const progressPercentage = ((currentLevelPoints || 0) / pointsNeededForNextLevel) * 100;

  const getNextLevel = (currentLevel: string) => {
    switch (currentLevel) {
      case 'B2': return 'C1';
      case 'C1': return 'C2';
      case 'C2': return null;
      default: return 'C1';
    }
  };

  const nextLevel = getNextLevel(user.cefrLevel);
  const isMaxLevel = user.cefrLevel === 'C2';

  const activityScores = [
    { label: "Article", points: 5, icon: BookOpen, style: "bg-secondary/15 text-secondary" },
    { label: "Video", points: 5, icon: Headphones, style: "bg-accent/15 text-accent" },
    { label: "Flashcard", points: 1, icon: Zap, style: "bg-bloom/15 text-bloom" },
  ];

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleCategoryToggle = (category: string) => {
    setEditedCategories(prev =>
      prev.includes(category)
        ? prev.filter(cat => cat !== category)
        : [...prev, category]
    );
  };

  const handleSaveName = () => {
    if (!editedName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Name cannot be empty.",
      });
      return;
    }

    updateUser({
      name: editedName.trim()
    });

    setIsEditingName(false);
  };

  const handleCancelEditName = () => {
    setEditedName(user?.name || '');
    setIsEditingName(false);
  };

  const handleSaveInterests = () => {
    updateUser({
      fieldsOfInterest: editedCategories
    });

    setIsEditingInterests(false);
  };

  const handleCancelEditInterests = () => {
    setEditedCategories(user?.fieldsOfInterest || []);
    setIsEditingInterests(false);
  };

  return (
    <div className="space-y-0">
      <PageContainer maxWidth="max-w-4xl" fullHeight={false}>
        {/* garden banner */}
        <div className="bg-primary rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar className="w-14 h-14 shrink-0">
              <AvatarFallback className="text-lg font-semibold bg-bloom text-bloom-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              {isEditingName ? (
                <div className="space-y-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-xl font-serif h-auto p-2 w-full sm:w-auto bg-primary text-primary-foreground border border-border rounded-md"
                    placeholder="Enter your name"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSaveName}>
                      <Save className="w-4 h-4" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCancelEditName}>
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-xl text-primary-foreground truncate">
                    {user.name}'s garden
                  </h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors shrink-0"
                    aria-label="Edit name"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="flex items-center gap-1.5 text-sm text-primary-foreground/70 mt-1 truncate">
                <Mail className="w-4 h-4 shrink-0" />
                {user.email} · tending since {formatShortDate(user.createdAt)}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <p className="text-sm text-primary-foreground/70">Current level</p>
            <Badge className="bg-secondary text-secondary-foreground rounded-full mt-1 hover:bg-secondary/90 transition-colors">
              {user.cefrLevel}
            </Badge>
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {statsData.map((item, index) => (
            <div key={index} className="rounded-lg p-3.5 bg-card border border-border text-center">
              <item.icon className={cn('h-6 w-6 mx-auto', item.color)} />
              <div className="text-2xl font-medium text-foreground mt-1">{item.value}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{item.title}</div>
            </div>
          ))}
        </div>

        {/* level progress */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            {!isMaxLevel ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base font-medium flex items-center gap-1.5">
                      <TrendingUp className="w-5 h-5 text-secondary" />
                      Progress to {nextLevel}
                    </span>
                    <span className="text-base text-secondary">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2.5">
                    {currentLevelPoints} out of {pointsNeededForNextLevel} points
                  </p>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className="bg-secondary h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                    Points by activity
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {activityScores.map((activity) => (
                      <div
                        key={activity.label}
                        className={cn('flex items-center justify-between rounded-lg px-3 py-2.5', activity.style)}
                      >
                        <div className="flex items-center gap-2">
                          <activity.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{activity.label}</span>
                        </div>
                        <span className="text-sm font-medium">+{activity.points}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Congratulations! You've reached the highest level: {user.cefrLevel}, keep it up!
              </p>
            )}
          </CardContent>
        </Card>

        {/* interests */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-base font-medium flex items-center gap-1.5">
                <Sprout className="w-5 h-5 text-secondary" />
                Your interest beds
              </span>
              {!isEditingInterests && (
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => setIsEditingInterests(true)}>
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Content is grown from the fields you care about
            </p>

            {isEditingInterests ? (
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Select your fields of interest
                </Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <Badge
                      key={category}
                      variant={editedCategories.includes(category) ? "default" : "outline"}
                      className="rounded-full cursor-pointer transition-all hover:scale-105"
                      onClick={() => handleCategoryToggle(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Selected {editedCategories.length} categories
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSaveInterests}>
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancelEditInterests}>
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : user.fieldsOfInterest.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.fieldsOfInterest.map((interest, index) => (
                  <span
                    key={index}
                    className="bg-secondary/15 text-secondary text-sm font-medium px-3 py-1 rounded-full"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No interests selected yet.</p>
            )}
          </CardContent>
        </Card>
      </PageContainer>
      <img
        src={unicorn}
        alt="Unicorn Image"
        className="mx-auto h-auto w-full section-px max-w-[250px]"
      />
    </div>
  );
};

export default ProfilePage;
