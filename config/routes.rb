Rails.application.routes.draw do
  root to: "users#intro"
  get "/intro" => "users#intro"
  get "/game" => "users#game"
    resources :users
    resources :posts
end
