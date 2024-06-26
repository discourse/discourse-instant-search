# frozen_string_literal: true

module ::InstantSearch
  class EventHandler
    def self.setup(plugin)
      ::InstantSearch::Collections::Base.subclasses.each do |collection|
        symbol_prefix = collection.class_name.underscore

        %w[created edited].each do |action|
          plugin.on("#{symbol_prefix}_#{action}".to_sym) do |target|
            Jobs.enqueue(:index, id: target.id, type: collection.class_name, action: "upsert")
          end
        end

        plugin.on("#{symbol_prefix}_destroyed".to_sym) do |target|
          Jobs.enqueue(:index, id: target.id, type: collection.class_name, action: "delete")
        end
      end
    end
  end
end
