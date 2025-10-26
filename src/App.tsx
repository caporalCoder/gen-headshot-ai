import { useState } from 'react';
import { Upload, Download, Loader2, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { RadioGroup, RadioGroupItem } from './components/ui/radio-group';
import { Label } from './components/ui/label';
import { HEADSHOT_PROMPTS, HeadshotStyle } from './prompts';
import { generateHeadshotsWithGemini } from './local/genai';

const STYLE_OPTIONS = [
  {
    id: 'corporate',
    name: 'Corporate Classic',
    description: 'Standard LinkedIn-style headshot with neutral background',
    emoji: '💼',
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-50 to-indigo-100',
    hoverGradient: 'from-blue-400 to-indigo-500',
    ringColor: 'ring-blue-500'
  },
  {
    id: 'creative',
    name: 'Creative Professional',
    description: 'Close-up with soft bokeh background and natural lighting',
    emoji: '✨',
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-50 to-orange-100',
    hoverGradient: 'from-amber-400 to-orange-500',
    ringColor: 'ring-amber-500'
  },
  {
    id: 'editorial',
    name: 'Editorial Portrait',
    description: 'Dramatic black and white portrait with artistic lighting',
    emoji: '🎨',
    gradient: 'from-gray-700 to-gray-900',
    bgGradient: 'from-gray-100 to-gray-200',
    hoverGradient: 'from-gray-600 to-gray-800',
    ringColor: 'ring-gray-600'
  },
  {
    id: 'techvisionary',
    name: 'Tech Visionary',
    description: 'Silicon Valley innovator with modern tech-forward aesthetic',
    emoji: '🚀',
    gradient: 'from-cyan-500 to-blue-600',
    bgGradient: 'from-cyan-50 to-blue-100',
    hoverGradient: 'from-cyan-400 to-blue-500',
    ringColor: 'ring-cyan-500'
  },
  {
    id: 'celebrity',
    name: 'Celebrity Glamour',
    description: 'High-end magazine quality with star power and luxury',
    emoji: '⭐',
    gradient: 'from-yellow-500 to-pink-600',
    bgGradient: 'from-yellow-50 to-pink-100',
    hoverGradient: 'from-yellow-400 to-pink-500',
    ringColor: 'ring-yellow-500'
  },
  {
    id: 'artistic',
    name: 'Artistic Rebel',
    description: 'Bold creative edge with authentic individuality',
    emoji: '🎭',
    gradient: 'from-fuchsia-500 to-purple-600',
    bgGradient: 'from-fuchsia-50 to-purple-100',
    hoverGradient: 'from-fuchsia-400 to-purple-500',
    ringColor: 'ring-fuchsia-500'
  }
];

export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<HeadshotStyle>('corporate');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Determine current step
  const currentStep = !originalImage ? 1 : (generatedImages.length === 0 ? 2 : 3);

  const processFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setGeneratedImages([]);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleGenerate = async () => {
    if (!originalImage) return;

    setIsGenerating(true);
    setGeneratingProgress(0);
    setError(null);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setGeneratingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 2000);

    try {
      const prompt = HEADSHOT_PROMPTS[selectedStyle];
      const images = await generateHeadshotsWithGemini(originalImage, selectedStyle, prompt);
      setGeneratingProgress(100);
      setGeneratedImages(images);
      setSelectedImageIndex(0);

      // Show success animation
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating headshot:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate headshot. Please try again.');
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setGeneratingProgress(0);
    }
  };

  const handleDownload = () => {
    if (generatedImages.length === 0) return;

    const link = document.createElement('a');
    link.href = generatedImages[selectedImageIndex];
    link.download = `headshot-${selectedStyle}-${selectedImageIndex + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSingle = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `headshot-${selectedStyle}-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    if (generatedImages.length === 0) return;

    generatedImages.forEach((image, index) => {
      const link = document.createElement('a');
      link.href = image;
      link.download = `headshot-${selectedStyle}-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleReset = () => {
    setOriginalImage(null);
    setGeneratedImages([]);
    setError(null);
    setSelectedStyle('corporate');
    setSelectedImageIndex(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4 relative overflow-hidden">
      {/* Decorative floating gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4 group">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
              <div className="absolute inset-0 w-8 h-8 text-purple-600 animate-ping opacity-20">
                <Sparkles className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-gradient-x">
              Gen HeadShot AI
            </h1>
          </div>
          <p className="text-slate-600 text-lg mb-3">Transform any photo into a professional headshot in seconds</p>
          <div className="flex justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>6 Styles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span>3 Variations Each</span>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-4">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-500 shadow-lg ${
                currentStep >= 1 
                  ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white scale-110 shadow-purple-300' 
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {currentStep > 1 ? <Check className="w-6 h-6" /> : '1'}
              </div>
              <span className={`text-sm transition-colors duration-300 ${
                currentStep >= 1 ? 'text-purple-600' : 'text-slate-600'
              }`}>Upload</span>
            </div>

            {/* Connector */}
            <div className="relative w-24 h-1 bg-gray-200 rounded overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 transition-all duration-700 ${
                currentStep >= 2 ? 'translate-x-0' : '-translate-x-full'
              }`} />
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-500 shadow-lg ${
                currentStep >= 2 
                  ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white scale-110 shadow-purple-300' 
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {currentStep > 2 ? <Check className="w-6 h-6" /> : '2'}
              </div>
              <span className={`text-sm transition-colors duration-300 ${
                currentStep >= 2 ? 'text-purple-600' : 'text-slate-600'
              }`}>Style</span>
            </div>

            {/* Connector */}
            <div className="relative w-24 h-1 bg-gray-200 rounded overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 transition-all duration-700 ${
                currentStep >= 3 ? 'translate-x-0' : '-translate-x-full'
              }`} />
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-500 shadow-lg ${
                currentStep >= 3 
                  ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white scale-110 shadow-purple-300' 
                  : 'bg-gray-200 text-gray-400'
              }`}>
                3
              </div>
              <span className={`text-sm transition-colors duration-300 ${
                currentStep >= 3 ? 'text-purple-600' : 'text-slate-600'
              }`}>Result</span>
            </div>
          </div>
        </div>

        {!originalImage ? (
          /* Upload Section */
          <Card 
            className={`max-w-2xl mx-auto p-16 border-2 shadow-lg transition-all duration-300 ${
              isDragging 
                ? 'border-purple-500 bg-purple-50 scale-105' 
                : 'border-purple-100 bg-white'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <div className={`mx-auto w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6 transition-transform duration-300 ${
                isDragging ? 'scale-110' : ''
              }`}>
                <Upload className={`w-16 h-16 text-purple-600 transition-transform duration-300 ${
                  isDragging ? 'scale-110' : ''
                }`} />
              </div>
              <h2 className="text-slate-900 mb-3">Upload Your Photo</h2>
              <p className="text-slate-600 mb-4 max-w-md mx-auto">
                {isDragging 
                  ? '✨ Drop your photo here!' 
                  : 'Drag and drop or click to choose a clear photo of yourself'
                }
              </p>
              <p className="text-slate-500 text-sm mb-8">
                Our AI will transform it into a professional headshot
              </p>
              <label htmlFor="file-upload">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300"
                  asChild
                >
                  <span className="cursor-pointer flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Choose Photo
                  </span>
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <p className="text-slate-500 mt-6 text-sm">
                Supports JPG, PNG • Max 5MB
              </p>
            </div>
          </Card>
        ) : (
          /* Style Selection and Generation */
          <div className="space-y-8">
            {/* Style Selection */}
            {generatedImages.length === 0 && (
              <div className="max-w-6xl mx-auto">
                {/* Decorative header */}
                <div className="text-center mb-10 relative">
                  <div className="inline-block relative">
                    <h2 className="text-slate-900 mb-2">Choose Your Style</h2>
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"></div>
                  </div>
                  <p className="text-slate-600 mt-4 mb-2">Select the perfect headshot style for your professional brand</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full text-sm text-purple-700 border border-purple-200">
                    <Sparkles className="w-4 h-4" />
                    <span>Each style generates 3 unique variations</span>
                  </div>
                </div>

                <RadioGroup
                  value={selectedStyle}
                  onValueChange={(value) => setSelectedStyle(value as HeadshotStyle)}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {STYLE_OPTIONS.map((style) => {
                    const isSelected = selectedStyle === style.id;
                    
                    return (
                      <div
                        key={style.id}
                        className="relative"
                        onClick={() => setSelectedStyle(style.id)}
                      >
                        <div
                          className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-500 cursor-pointer group h-full ${
                            isSelected 
                              ? `${style.ringColor} ring-4 shadow-2xl scale-105 border-transparent` 
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-xl hover:scale-102'
                          }`}
                        >
                          <RadioGroupItem value={style.id} id={style.id} className="sr-only" />
                          
                          {/* Gradient header with emoji */}
                          <div className={`bg-gradient-to-br ${isSelected ? style.gradient : style.bgGradient} p-8 text-center transition-all duration-500 relative overflow-hidden`}>
                            {/* Animated background effect on hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${style.hoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                            
                            {/* Emoji with pulse animation on select */}
                            <div className={`text-7xl mb-3 transition-all duration-500 relative z-10 ${
                              isSelected 
                                ? 'scale-125 animate-bounce' 
                                : 'group-hover:scale-110 group-hover:rotate-6'
                            }`}>
                              {style.emoji}
                            </div>
                            
                            {/* Style name in header for selected state */}
                            {isSelected && (
                              <div className="text-white text-lg relative z-10 animate-fade-in">
                                {style.name}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className={`p-6 bg-white transition-all duration-300 ${isSelected ? 'bg-gradient-to-b from-white to-gray-50' : ''}`}>
                            <Label htmlFor={style.id} className="cursor-pointer">
                              {!isSelected && (
                                <div className="text-slate-900 text-center mb-3">{style.name}</div>
                              )}
                              <p className={`text-slate-600 text-sm text-center leading-relaxed transition-all duration-300 ${
                                isSelected ? 'text-slate-700' : ''
                              }`}>
                                {style.description}
                              </p>
                            </Label>
                          </div>

                          {/* Selected indicator with checkmark */}
                          {isSelected && (
                            <div className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xl animate-scale-in">
                              <div className={`w-8 h-8 bg-gradient-to-br ${style.gradient} rounded-full flex items-center justify-center`}>
                                <Check className="w-5 h-5 text-white font-bold" strokeWidth={3} />
                              </div>
                            </div>
                          )}

                          {/* Glow effect on hover */}
                          <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none bg-gradient-to-br ${style.gradient} blur-xl`} />
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            )}

            {/* Preview or Comparison */}
            {generatedImages.length === 0 ? (
              <Card className="p-8 max-w-3xl mx-auto border-2 border-purple-100 shadow-lg bg-gradient-to-b from-white to-purple-50/30">
                <div className="text-center mb-6">
                  <h3 className="text-slate-900 mb-2">Ready to Transform</h3>
                  <p className="text-slate-600 text-sm">Your photo will be transformed into the selected style</p>
                </div>

                {/* Show selected style info */}
                <div className="mb-8 p-6 bg-white rounded-2xl border-2 border-purple-200 shadow-sm">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="text-5xl">{STYLE_OPTIONS.find(s => s.id === selectedStyle)?.emoji}</div>
                    <div className="text-left">
                      <div className="text-slate-900 mb-1">{STYLE_OPTIONS.find(s => s.id === selectedStyle)?.name}</div>
                      <p className="text-slate-600 text-sm">{STYLE_OPTIONS.find(s => s.id === selectedStyle)?.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mb-8">
                  <div className="relative max-w-md w-full">
                    <div className="relative">
                      <img
                        src={originalImage}
                        alt="Original"
                        className="rounded-2xl shadow-xl w-full border-4 border-white"
                      />
                      <div className="absolute top-4 left-4 bg-slate-900/80 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                        Original Photo
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="border-purple-200 hover:border-purple-300 hover:bg-purple-50"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Different Photo
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    size="lg"
                    className={`bg-gradient-to-r ${STYLE_OPTIONS.find(s => s.id === selectedStyle)?.gradient || 'from-purple-600 to-blue-600'} hover:opacity-90 text-white px-8 shadow-lg transition-all duration-300`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating 3 Variations...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.name}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ) : (
              /* Results - 3 Variations */
              <div className="space-y-8">
                {/* Success message */}
                {showSuccess && (
                  <div className="max-w-2xl mx-auto bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-lg animate-fade-in">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-scale-in">
                        <Check className="w-7 h-7 text-white" strokeWidth={3} />
                      </div>
                      <div>
                        <h4 className="text-green-900 mb-1">Success! 🎉</h4>
                        <p className="text-green-700 text-sm">Your professional headshots are ready!</p>
                      </div>
                    </div>
                  </div>
                )}

                <Card className="p-8 border-2 border-purple-100 shadow-lg bg-gradient-to-b from-white to-purple-50/20">
                  <div className="text-center mb-8">
                    <h3 className="text-slate-900 mb-2">Your Professional Headshots</h3>
                    <p className="text-slate-600">Choose your favorite from {generatedImages.length} variations</p>
                  </div>

                  {/* 3 Generated Variations */}
                  <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto">
                    {generatedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <div 
                          className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                            selectedImageIndex === index 
                              ? 'ring-4 ring-purple-600 shadow-2xl scale-105' 
                              : 'hover:ring-2 hover:ring-purple-300 hover:scale-102 shadow-xl'
                          }`}
                          onClick={() => setSelectedImageIndex(index)}
                        >
                          <img
                            src={image}
                            alt={`Variation ${index + 1}`}
                            className="w-full border-4 border-white"
                          />
                          
                          {/* Number badge */}
                          <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                            #{index + 1}
                          </div>
                          
                          {/* Selected checkmark */}
                          {selectedImageIndex === index && (
                            <div className="absolute top-3 right-3 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          )}

                          {/* Download button - appears on hover */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadSingle(image, index);
                            }}
                            className="absolute bottom-3 right-3 w-10 h-10 bg-white/95 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                            title="Download this variation"
                          >
                            <Download className="w-5 h-5 text-purple-600" />
                          </button>

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comparison Toggle */}
                  <div className="text-center mb-6">
                    <button
                      onClick={() => setShowComparison(!showComparison)}
                      className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 mx-auto"
                    >
                      <ImageIcon className="w-4 h-4" />
                      {showComparison ? 'Hide' : 'Show'} Original Comparison
                    </button>
                  </div>

                  {/* Before/After Comparison */}
                  {showComparison && (
                    <div className="grid md:grid-cols-2 gap-8 mb-8 max-w-4xl mx-auto">
                      <div>
                        <p className="text-center text-slate-600 mb-3">Original</p>
                        <div className="relative">
                          <img
                            src={originalImage}
                            alt="Original"
                            className="rounded-2xl shadow-xl w-full border-4 border-white"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-center text-slate-600 mb-3">Selected Headshot</p>
                        <div className="relative">
                          <img
                            src={generatedImages[selectedImageIndex]}
                            alt="Selected"
                            className="rounded-2xl shadow-xl w-full border-4 border-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4 justify-center flex-wrap">
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="border-purple-200 hover:border-purple-300 hover:bg-purple-50"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Start Over
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setGeneratedImages([])}
                      className="border-purple-200 hover:border-purple-300 hover:bg-purple-50"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Try Different Style
                    </Button>
                    <Button
                      onClick={handleDownload}
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download Selected
                    </Button>
                    <Button
                      onClick={handleDownloadAll}
                      variant="outline"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download All 3
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="max-w-2xl mx-auto bg-red-50 border-2 border-red-200 rounded-xl p-6 shadow-md">
                <p className="text-red-900 text-center">{error}</p>
              </div>
            )}

            {/* Loading Overlay */}
            {isGenerating && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <Card className="p-10 max-w-md mx-4 bg-white shadow-2xl">
                  <div className="text-center">
                    <div className="mb-6 flex justify-center">
                      <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${STYLE_OPTIONS.find(s => s.id === selectedStyle)?.gradient} flex items-center justify-center animate-pulse`}>
                        <Sparkles className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-slate-900 mb-2">Creating Your Headshots</h3>
                    <p className="text-slate-600 mb-6">Generating 3 unique variations of {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.name}...</p>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${STYLE_OPTIONS.find(s => s.id === selectedStyle)?.gradient} transition-all duration-500 ease-out`}
                        style={{ width: `${generatingProgress}%` }}
                      />
                    </div>
                    <p className="text-slate-500 text-sm">This may take 20-30 seconds...</p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 pb-8">
          <div className="inline-flex flex-col items-center gap-3 px-8 py-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-sm">
            <p className="text-slate-600 text-sm">
              Powered by <span className="text-purple-600">Google Gemini AI</span>
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Transform your photos into professional headshots</span>
              <span>•</span>
              <span className="text-purple-600 hover:text-purple-700 transition-colors">@caporalCoder</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
