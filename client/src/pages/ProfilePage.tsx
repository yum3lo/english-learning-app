import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Video, Trophy, Trash, Edit3, Calendar, Mail, Bookmark, TrendingUp, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CATEGORIES } from '@/constants/categories';
import { useToast } from '@/hooks/use-toast';

const ProfilePage = () => {
  const { user, updateUser, deleteAccount } = useAuth();
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
            <CardDescription>Please log in to view your profile.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const progressData = [
    {
      title: "Articles Read",
      value: user.articlesRead || 0,
      icon: BookOpen,
      color: "text-primary", 
      style: "bg-primary/30 border-primary"
    },
    {
      title: "Videos Watched",
      value: user.videosWatched || 0,
      icon: Video,
      color: "text-secondary",
      style: "bg-secondary/30 border-secondary"
    },
    {
      title: "Words Learned",
      value: user.wordsLearned || 0,
      icon: Trophy,
      color: "text-foreground",
      style: "bg-foreground/30 border-foreground"
    }
  ];

  const currentLevelPoints = user.points;
  const pointsNeededForNextLevel = 200;
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
  
  const activityScores = {
    videosWatched: 5,
    articlesRead: 5,
    flashcardsLearned: 1
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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

  const handleDeleteAccount = async () => {
    const userConfirmation = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (userConfirmation) {
      try {
        await deleteAccount();
      } catch (error) {
        console.error('Delete account failed:', error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <Card className="flex-1">
          <CardHeader>
            {/* mobile layout */}
            <div className="flex md:hidden flex-col space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {isEditingName ? (
                    <div className="space-y-2">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="text-xl font-bold h-auto p-2"
                        placeholder="Enter your name"
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
                      <CardTitle className="text-xl">{user.name}</CardTitle>
                      <Button variant="none" size="sm" className='p-0' onClick={() => setIsEditingName(true)}>
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <p className="text-sm">Member Since</p>
                  <p className="text-sm font-medium flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* desktop layout */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  {isEditingName ? (
                    <div className="space-y-2">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="text-2xl font-bold h-auto p-2"
                        placeholder="Enter your name"
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
                      <CardTitle className="text-2xl">{user.name}</CardTitle>
                      <Button variant="none" size="sm" className='p-0' onClick={() => setIsEditingName(true)}>
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </CardDescription>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-end">Member Since</p>
                <p className="text-sm font-medium flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm">Current Level</p>
                <Badge variant="secondary" className="mt-1">
                  {user.cefrLevel}
                </Badge>
              </div>
              {user.dateOfBirth && (
                <div>
                  <p className="text-sm">Date of Birth</p>
                  <p className="text-sm font-medium mt-1">
                    {formatDate(user.dateOfBirth)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {progressData.map((item, index) => (
          <Card key={index} className={item.style}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {item.title}
              </CardTitle>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Current Level Progress
          </CardTitle>
          <CardDescription>
            {isMaxLevel 
              ? `Congratulations! You've reached the highest level: ${user.cefrLevel}, keep it up!`
              : `Your progress in ${user.cefrLevel} level and points toward ${nextLevel}`
            }
          </CardDescription>
        </CardHeader>
        {!isMaxLevel ? (
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress to {nextLevel}</span>
                  <span className="text-sm">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <div className="w-full bg-primary/50 rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs">
                  {currentLevelPoints} out of {pointsNeededForNextLevel} points
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm uppercase tracking-wide">
                  Points by Activity
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between p-3 bg-primary/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Article</span>
                    </div>
                    <Badge variant="outline" className="text-primary border-primary">
                      +{activityScores.articlesRead}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-secondary" />
                      <span className="text-sm font-medium">Video</span>
                    </div>
                    <Badge variant="outline" className="text-secondary border-secondary">
                      +{activityScores.videosWatched}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-foreground/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      <span className="text-sm font-medium">Flashcard</span>
                    </div>
                    <Badge variant="outline" className="border-foreground">
                      +{activityScores.flashcardsLearned}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <p>No further levels available.</p>
          </CardContent>
        )}
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="w-5 h-5" />
            Learning Interests
          </CardTitle>
          <CardDescription>
            Your selected fields of interest for personalized content
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => handleCategoryToggle(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
              <p className="text-xs">
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
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                {user.fieldsOfInterest.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.fieldsOfInterest.map((interest, index) => (
                      <Badge key={index} variant="default">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p>No interests selected yet.</p>
                )}
              </div>
              <div className="flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => setIsEditingInterests(true)}>
                  <Edit3 className="w-4 h-4" />
                  Edit Interests
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center mt-8">
        <Button 
          variant="destructive"
          size="lg"
          className="w-full sm:w-auto"
          onClick={handleDeleteAccount}
        >
          <Trash className="w-4 h-4" />
          Delete Account
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;