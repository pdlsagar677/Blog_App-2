// app/about/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Users, Heart, Star, ArrowRight, PenTool, Globe, Shield, Target, Award, BarChart3 } from "lucide-react";

// Icon mapping
const iconMap = {
  PenTool: PenTool,
  Globe: Globe,
  Users: Users,
  Shield: Shield,
  BookOpen: BookOpen,
  Heart: Heart,
  Star: Star,
  Target: Target,
  Award: Award,
  BarChart3: BarChart3
};

interface AboutContent {
  hero: {
    title: string;
    subtitle: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  stats: Array<{
    number: string;
    label: string;
  }>;
  mission: {
    title: string;
    description: string;
    forWriters: {
      title: string;
      description: string;
      features: string[];
    };
    forReaders: {
      title: string;
      description: string;
      features: string[];
    };
  };
  features: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  milestones: Array<{
    year: string;
    title: string;
    description: string;
  }>;
  team: {
    title: string;
    description: string;
  };
  teamMembers: Array<{
    id: string;
    name: string;
    position: string;
    bio: string;
    imageUrl: string;
    email?: string;
    socialLinks?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
    };
  }>;
}

export default function AboutPage() {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAboutContent();
  }, []);

  const fetchAboutContent = async () => {
    try {
      const response = await fetch('/api/about');
      const result = await response.json();
      
      if (result.success) {
        setContent(result.content);
      }
    } catch (error) {
      console.error('Error fetching about content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load content</p>
        </div>
      </div>
    );
  }

  const { hero, stats, mission, features, milestones, team, teamMembers } = content;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-500 p-4 rounded-2xl shadow-lg">
              <BookOpen size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            {hero.title} <span className="text-blue-600">{hero.subtitle}</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            {hero.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center justify-center"
            >
              {hero.ctaPrimary}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link 
              href="/blog"
              className="border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center"
            >
              {hero.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="p-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{mission.title}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {mission.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{mission.forWriters.title}</h3>
              <p className="text-gray-600 mb-4">
                {mission.forWriters.description}
              </p>
              <ul className="text-gray-600 space-y-2">
                {mission.forWriters.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Star className="w-5 h-5 text-blue-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{mission.forReaders.title}</h3>
              <p className="text-gray-600 mb-4">
                {mission.forReaders.description}
              </p>
              <ul className="text-gray-600 space-y-2">
                {mission.forReaders.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Heart className="w-5 h-5 text-red-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose BlogHub?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We've built BlogHub with writers and readers in mind, focusing on what 
              really matters for creating and discovering great content.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = iconMap[feature.icon as keyof typeof iconMap] || PenTool;
              return (
                <div key={index} className="text-center p-6">
                  <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      {teamMembers.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{team.title}</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {team.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {teamMembers.map((member) => (
                <div key={member.id} className="bg-white rounded-2xl shadow-lg p-6 text-center">
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-blue-100"
                  />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-3">{member.position}</p>
                  <p className="text-gray-600 mb-4">{member.bio}</p>
                  
                  {(member.socialLinks?.twitter || member.socialLinks?.linkedin || member.socialLinks?.github) && (
                    <div className="flex justify-center space-x-4">
                      {member.socialLinks?.twitter && (
                        <a
                          href={member.socialLinks.twitter}
                          className="text-gray-400 hover:text-blue-400 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Twitter
                        </a>
                      )}
                      {member.socialLinks?.linkedin && (
                        <a
                          href={member.socialLinks.linkedin}
                          className="text-gray-400 hover:text-blue-700 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          LinkedIn
                        </a>
                      )}
                      {member.socialLinks?.github && (
                        <a
                          href={member.socialLinks.github}
                          className="text-gray-400 hover:text-gray-700 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          GitHub
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Journey Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Journey</h2>
            <p className="text-lg text-gray-600">
              From a simple idea to a global community of writers and readers
            </p>
          </div>

          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start space-x-6">
                <div className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-lg min-w-20 text-center">
                  {milestone.year}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                  <p className="text-gray-600">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Your Story?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of writers who are already sharing their stories and building their audience on BlogHub.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
          
            <Link 
              href="/blog"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center"
            >
              Explore Stories
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}