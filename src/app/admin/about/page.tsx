"use client";
import { useEffect, useState } from "react";
import { useAboutStore } from "@/store/useAboutStore";
import { Edit, Save, Plus, Trash2, Users, BarChart3, BookOpen, Camera } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";

export default function AdminAbout() {
  const { 
    content, 
    teamMembers, 
    isLoading, 
    error, 
    fetchAboutContent, 
    updateSection, 
    createTeamMember, 
    updateTeamMember, 
    deleteTeamMember,
    clearError 
  } = useAboutStore();

  const [activeSection, setActiveSection] = useState<string>("hero");
  const [editingTeamMember, setEditingTeamMember] = useState<string | null>(null);
  const [showTeamForm, setShowTeamForm] = useState(false);
  
  // Form states for different sections
  const [heroForm, setHeroForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    ctaPrimary: "",
    ctaSecondary: ""
  });

  const [teamForm, setTeamForm] = useState({
    name: "",
    position: "",
    bio: "",
    imageUrl: "",
    email: "",
    twitter: "",
    linkedin: "",
    github: ""
  });

  const [statsForm, setStatsForm] = useState<Array<{ number: string; label: string }>>([]);

  // Image upload states
  const [teamImageFile, setTeamImageFile] = useState<File | null>(null);
  const [teamImagePreview, setTeamImagePreview] = useState<string>("");
  const [isUploadingTeamImage, setIsUploadingTeamImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string>("");

  useEffect(() => {
    fetchAboutContent();
  }, [fetchAboutContent]);

  useEffect(() => {
    if (content) {
      setHeroForm(content.hero);
      setStatsForm(content.stats);
    }
  }, [content]);

  // Clean up preview URLs
  useEffect(() => {
    return () => {
      if (teamImagePreview) {
        URL.revokeObjectURL(teamImagePreview);
      }
    };
  }, [teamImagePreview]);

  const handleSaveSection = async (section: string, data: any) => {
    try {
      await updateSection(section, data);
    } catch (error) {
      console.error('Error saving section:', error);
    }
  };

  const handleSaveHero = async () => {
    await handleSaveSection("hero", heroForm);
  };

  const handleSaveStats = async () => {
    await handleSaveSection("stats", statsForm);
  };

  const handleAddStat = () => {
    setStatsForm([...statsForm, { number: "", label: "" }]);
  };

  const handleRemoveStat = (index: number) => {
    setStatsForm(statsForm.filter((_, i) => i !== index));
  };

  // Image upload functions
  const handleTeamImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setUploadMessage('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadMessage('Image size must be less than 10MB');
        return;
      }

      setTeamImageFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setTeamImagePreview(previewUrl);
      setUploadMessage('');
      
      // Upload to Cloudinary immediately
      setIsUploadingTeamImage(true);
      setUploadMessage('📤 Uploading image to Cloudinary...');
      
      try {
        const imageUrl = await uploadToCloudinary(file);
        setTeamForm(prev => ({ ...prev, imageUrl }));
        setUploadMessage('✅ Image uploaded successfully!');
      } catch (error) {
        console.error('Error uploading image:', error);
        setUploadMessage('❌ Failed to upload image. Please try again.');
        // Remove the file if upload fails
        setTeamImageFile(null);
        URL.revokeObjectURL(previewUrl);
        setTeamImagePreview("");
      } finally {
        setIsUploadingTeamImage(false);
        // Clear success message after 3 seconds
        setTimeout(() => {
          setUploadMessage('');
        }, 3000);
      }
    }
  };

  const removeTeamImage = () => {
    setTeamImageFile(null);
    if (teamImagePreview) {
      URL.revokeObjectURL(teamImagePreview);
      setTeamImagePreview("");
    }
    setTeamForm(prev => ({ ...prev, imageUrl: "/images/default-avatar.png" }));
    setUploadMessage('');
  };

  const handleCreateTeamMember = async () => {
    if (!teamForm.name || !teamForm.position || !teamForm.bio) {
      setUploadMessage('Name, position, and bio are required');
      return;
    }

    try {
      const socialLinks = {
        ...(teamForm.twitter && { twitter: teamForm.twitter }),
        ...(teamForm.linkedin && { linkedin: teamForm.linkedin }),
        ...(teamForm.github && { github: teamForm.github })
      };

      await createTeamMember({
        name: teamForm.name,
        position: teamForm.position,
        bio: teamForm.bio,
        imageUrl: teamForm.imageUrl || "/images/default-avatar.png",
        email: teamForm.email || undefined,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        order: teamMembers.length,
        isActive: true
      });

      setShowTeamForm(false);
      setTeamForm({
        name: "",
        position: "",
        bio: "",
        imageUrl: "",
        email: "",
        twitter: "",
        linkedin: "",
        github: ""
      });
      removeTeamImage(); // Reset image state
      setUploadMessage('✅ Team member created successfully!');
      
      // Clear success message
      setTimeout(() => {
        setUploadMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error creating team member:', error);
      setUploadMessage('❌ Failed to create team member');
    }
  };

  const handleUpdateTeamMember = async (id: string) => {
    if (!teamForm.name || !teamForm.position || !teamForm.bio) {
      setUploadMessage('Name, position, and bio are required');
      return;
    }

    try {
      const socialLinks = {
        ...(teamForm.twitter && { twitter: teamForm.twitter }),
        ...(teamForm.linkedin && { linkedin: teamForm.linkedin }),
        ...(teamForm.github && { github: teamForm.github })
      };

      await updateTeamMember(id, {
        name: teamForm.name,
        position: teamForm.position,
        bio: teamForm.bio,
        imageUrl: teamForm.imageUrl,
        email: teamForm.email || undefined,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined
      });

      setEditingTeamMember(null);
      removeTeamImage(); // Reset image state
      setUploadMessage('✅ Team member updated successfully!');
      
      // Clear success message
      setTimeout(() => {
        setUploadMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error updating team member:', error);
      setUploadMessage('❌ Failed to update team member');
    }
  };

  const handleEditTeamMember = (member: any) => {
    setEditingTeamMember(member.id);
    setTeamForm({
      name: member.name,
      position: member.position,
      bio: member.bio,
      imageUrl: member.imageUrl,
      email: member.email || "",
      twitter: member.socialLinks?.twitter || "",
      linkedin: member.socialLinks?.linkedin || "",
      github: member.socialLinks?.github || ""
    });
    
    // Clear any existing preview when editing
    if (teamImagePreview) {
      URL.revokeObjectURL(teamImagePreview);
      setTeamImagePreview("");
    }
    setTeamImageFile(null);
    setUploadMessage('');
  };

  const handleDeleteTeamMember = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this team member?")) {
      try {
        await deleteTeamMember(id);
        setUploadMessage('✅ Team member deleted successfully!');
        
        // Clear success message
        setTimeout(() => {
          setUploadMessage('');
        }, 3000);
      } catch (error) {
        console.error('Error deleting team member:', error);
        setUploadMessage('❌ Failed to delete team member');
      }
    }
  };

  const resetTeamForm = () => {
    setShowTeamForm(false);
    setEditingTeamMember(null);
    setTeamForm({
      name: "",
      position: "",
      bio: "",
      imageUrl: "",
      email: "",
      twitter: "",
      linkedin: "",
      github: ""
    });
    removeTeamImage();
    setUploadMessage('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={clearError}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700">No content found. Please check if the about page data is properly initialized.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">About Page Management</h2>
      </div>

      {/* Upload Message */}
      {uploadMessage && (
        <div className={`p-4 rounded-lg ${
          uploadMessage.includes('❌') 
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          {uploadMessage}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex overflow-x-auto">
            {[
              { id: "hero", name: "Hero Section", icon: BookOpen },
              { id: "stats", name: "Statistics", icon: BarChart3 },
              { id: "team", name: "Team Members", icon: Users }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeSection === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Hero Section Editor */}
          {activeSection === "hero" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Hero Section</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={heroForm.title}
                    onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={heroForm.subtitle}
                    onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={heroForm.description}
                    onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary CTA Text</label>
                    <input
                      type="text"
                      value={heroForm.ctaPrimary}
                      onChange={(e) => setHeroForm({ ...heroForm, ctaPrimary: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secondary CTA Text</label>
                    <input
                      type="text"
                      value={heroForm.ctaSecondary}
                      onChange={(e) => setHeroForm({ ...heroForm, ctaSecondary: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSaveHero}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Hero Section</span>
                </button>
              </div>
            </div>
          )}

          {/* Stats Section Editor */}
          {activeSection === "stats" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Statistics</h3>
                <button
                  onClick={handleAddStat}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md font-medium flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Stat</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {statsForm.map((stat, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Number</label>
                        <input
                          type="text"
                          value={stat.number}
                          onChange={(e) => {
                            const newStats = [...statsForm];
                            newStats[index].number = e.target.value;
                            setStatsForm(newStats);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          placeholder="50K+"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                        <input
                          type="text"
                          value={stat.label}
                          onChange={(e) => {
                            const newStats = [...statsForm];
                            newStats[index].label = e.target.value;
                            setStatsForm(newStats);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          placeholder="Active Writers"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveStat(index)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleSaveStats}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Statistics</span>
                </button>
              </div>
            </div>
          )}

          {/* Team Members Section */}
          {activeSection === "team" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                <button
                  onClick={() => setShowTeamForm(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Team Member</span>
                </button>
              </div>

              {/* Team Member Form */}
              {(showTeamForm || editingTeamMember) && (
                <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    {editingTeamMember ? 'Edit Team Member' : 'Add New Team Member'}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={teamForm.name}
                        onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                      <input
                        type="text"
                        value={teamForm.position}
                        onChange={(e) => setTeamForm({ ...teamForm, position: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio *</label>
                      <textarea
                        value={teamForm.bio}
                        onChange={(e) => setTeamForm({ ...teamForm, bio: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        required
                      />
                    </div>

                    {/* Image Upload Section */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Profile Picture
                      </label>
                      
                      {/* Image Preview */}
                      {(teamForm.imageUrl || teamImagePreview) && (
                        <div className="mb-4 flex items-center space-x-4">
                          <img
                            src={teamImagePreview || teamForm.imageUrl}
                            alt="Team member preview"
                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                          />
                          <div className="text-sm text-gray-600">
                            <p>Current image preview</p>
                            {teamForm.imageUrl && !teamImagePreview && (
                              <p className="text-xs text-gray-500 truncate max-w-xs">
                                {teamForm.imageUrl}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* File Upload */}
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleTeamImageSelect}
                            className="hidden"
                            disabled={isUploadingTeamImage}
                          />
                          <div className={`w-full py-2 px-4 rounded-md text-center font-medium flex items-center justify-center space-x-2 ${
                            isUploadingTeamImage
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                          }`}>
                            {isUploadingTeamImage ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Camera className="w-4 h-4" />
                                <span>Choose Image</span>
                              </>
                            )}
                          </div>
                        </label>
                        
                        {/* Remove Image Button */}
                        {(teamForm.imageUrl && teamForm.imageUrl !== "/images/default-avatar.png") && (
                          <button
                            type="button"
                            onClick={removeTeamImage}
                            disabled={isUploadingTeamImage}
                            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            Remove Image
                          </button>
                        )}
                      </div>
                      
                      {/* Help Text */}
                      <p className="text-xs text-gray-500 mt-2">
                        Upload a profile picture (Max 10MB, JPG, PNG, GIF, WebP). 
                        Images are automatically uploaded to Cloudinary.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={teamForm.email}
                        onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                      <input
                        type="text"
                        value={teamForm.twitter}
                        onChange={(e) => setTeamForm({ ...teamForm, twitter: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        placeholder="username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                      <input
                        type="text"
                        value={teamForm.linkedin}
                        onChange={(e) => setTeamForm({ ...teamForm, linkedin: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        placeholder="username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                      <input
                        type="text"
                        value={teamForm.github}
                        onChange={(e) => setTeamForm({ ...teamForm, github: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        placeholder="username"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={editingTeamMember ? 
                        () => handleUpdateTeamMember(editingTeamMember) : 
                        handleCreateTeamMember
                      }
                      disabled={isUploadingTeamImage || !teamForm.name || !teamForm.position || !teamForm.bio}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {editingTeamMember ? 'Update Member' : 'Create Member'}
                    </button>
                    <button
                      onClick={resetTeamForm}
                      disabled={isUploadingTeamImage}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium disabled:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Team Members List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <div key={member.id} className="bg-white border rounded-lg p-6 text-center">
                      <img
                        src={member.imageUrl}
                        alt={member.name}
                        className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.currentTarget.src = "/images/default-avatar.png";
                        }}
                      />
                      <h4 className="font-semibold text-gray-900">{member.name}</h4>
                      <p className="text-blue-600 mb-2">{member.position}</p>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{member.bio}</p>
                      
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEditTeamMember(member)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeamMember(member.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No team members added yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}