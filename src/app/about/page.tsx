// app/about/page.tsx
import Link from "next/link";
import { BookOpen, Users, Heart, Star, ArrowRight, PenTool, Globe, Shield } from "lucide-react";

export default function AboutPage() {
  const features = [
    {
      icon: <PenTool className="w-8 h-8" />,
      title: "Easy Writing Experience",
      description: "Our intuitive editor makes writing and formatting your stories effortless. Focus on your content while we handle the technical details."
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Reach",
      description: "Share your stories with readers from around the world. Our platform connects writers with audiences across 120+ countries."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Vibrant Community",
      description: "Join thousands of writers who share, support, and inspire each other. Build your audience and connect with like-minded creators."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Safe Space",
      description: "We prioritize creating a respectful and inclusive environment where all voices can be heard without fear of harassment."
    }
  ];

  const stats = [
    { number: "50K+", label: "Active Writers" },
    { number: "500K+", label: "Blog Posts" },
    { number: "10M+", label: "Monthly Readers" },
    { number: "120+", label: "Countries" }
  ];

  const milestones = [
    {
      year: "2020",
      title: "BlogHub Founded",
      description: "Started with a simple mission: to create the best platform for writers and readers to connect."
    },
    {
      year: "2021",
      title: "First 10K Users",
      description: "Reached our first major milestone with 10,000 passionate writers joining our community."
    },
    {
      year: "2022",
      title: "Mobile App Launch",
      description: "Expanded our reach with dedicated mobile apps for iOS and Android."
    },
    {
      year: "2023",
      title: "Global Recognition",
      description: "Featured as one of the top emerging platforms for digital content creators."
    }
  ];

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
            About <span className="text-blue-600">BlogHub</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            BlogHub is more than just a blogging platform—it's a vibrant community where 
            writers and readers come together to share stories, ideas, and inspiration. 
            We're building the future of digital storytelling, one post at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center justify-center"
            >
              Start Writing Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link 
              href="/blog"
              className="border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center"
            >
              Explore Blogs
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              To empower every voice by providing a platform where stories can be shared, 
              discovered, and celebrated. We believe that everyone has a story worth telling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Writers</h3>
              <p className="text-gray-600 mb-4">
                Whether you're a seasoned author or just starting your writing journey, 
                BlogHub provides the tools and audience you need to succeed. Write about 
                your passions, build your brand, and connect with readers who appreciate your work.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center">
                  <Star className="w-5 h-5 text-blue-500 mr-2" />
                  Easy-to-use writing tools
                </li>
                <li className="flex items-center">
                  <Star className="w-5 h-5 text-blue-500 mr-2" />
                  Built-in audience growth
                </li>
                <li className="flex items-center">
                  <Star className="w-5 h-5 text-blue-500 mr-2" />
                  Real-time analytics
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Readers</h3>
              <p className="text-gray-600 mb-4">
                Discover incredible content from writers around the world. Follow your 
                favorite authors, explore new topics, and be part of a community that 
                values quality writing and diverse perspectives.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center">
                  <Heart className="w-5 h-5 text-red-500 mr-2" />
                  Personalized recommendations
                </li>
                <li className="flex items-center">
                  <Heart className="w-5 h-5 text-red-500 mr-2" />
                  Save your favorite articles
                </li>
                <li className="flex items-center">
                  <Heart className="w-5 h-5 text-red-500 mr-2" />
                  Engage with writers directly
                </li>
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
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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